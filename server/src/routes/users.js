const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

function slugify(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueSlug(baseSlug) {
  const safeBase = slugify(baseSlug) || `tenant-${Date.now()}`;
  let slug = safeBase;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;

    slug = `${safeBase}-${suffix}`;
    suffix += 1;
  }
}

async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*, tenant:tenants(*)')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

router.get('/me', async (req, res) => {
  res.json(req.auth.profile);
});

router.get('/tenants', requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  try {
    let query = supabase
      .from('tenants')
      .select('*')
      .order('name', { ascending: true });

    if (req.auth.profile.role === 'tenant_admin') {
      query = query.eq('id', req.auth.profile.tenant_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

router.get('/', requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  try {
    let query = supabase
      .from('user_profiles')
      .select('*, tenant:tenants(*)')
      .order('created_at', { ascending: false });

    if (req.auth.profile.role === 'tenant_admin') {
      query = query.eq('tenant_id', req.auth.profile.tenant_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  const actor = req.auth.profile;
  const {
    email,
    password,
    fullName,
    role,
    tenantId,
    tenantName,
    tenantSlug,
    tenantPlan,
    tenantMaxUsers,
  } = req.body;

  let createdTenant = null;
  let createdAuthUserId = null;
  let createdTenantInThisRequest = false;

  try {
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: true, message: 'Nome, email, senha e perfil são obrigatórios' });
    }

    if (!['tenant_admin', 'tenant_user'].includes(role)) {
      return res.status(400).json({ error: true, message: 'Perfil inválido para criação de usuário' });
    }

    let targetTenantId = tenantId || null;

    if (actor.role === 'tenant_admin') {
      if (role !== 'tenant_user') {
        return res.status(403).json({ error: true, message: 'Administrador de tenant só pode criar usuários da própria tenant' });
      }

      targetTenantId = actor.tenant_id;
    }

    if (actor.role === 'superadmin' && role === 'tenant_admin') {
      if (!tenantName) {
        return res.status(400).json({ error: true, message: 'Nome da tenant é obrigatório para criar um administrador' });
      }

      const slug = await ensureUniqueSlug(tenantSlug || tenantName);
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantName,
          slug,
          plan: tenantPlan || 'pro',
          max_users: Number(tenantMaxUsers) || 10,
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      createdTenant = tenant;
      createdTenantInThisRequest = true;
      targetTenantId = tenant.id;
    }

    if (role === 'tenant_user' && !targetTenantId) {
      return res.status(400).json({ error: true, message: 'Tenant obrigatória para criar usuários comuns' });
    }

    if (targetTenantId) {
      const { data: tenantExists, error: tenantExistsError } = await supabase
        .from('tenants')
        .select('id, name, slug, plan, max_users, is_active')
        .eq('id', targetTenantId)
        .single();

      if (tenantExistsError) throw tenantExistsError;
      createdTenant = tenantExists;

      const { count, error: usersCountError } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', targetTenantId);

      if (usersCountError) throw usersCountError;

      if (createdTenant.max_users && count >= createdTenant.max_users) {
        return res.status(400).json({
          error: true,
          message: 'A tenant selecionada já atingiu o limite máximo de usuários',
        });
      }
    }

    const { data: createdUserResult, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        tenant_id: targetTenantId,
      },
    });

    if (authError) {
      throw authError;
    }

    const createdUser = createdUserResult.user;
    createdAuthUserId = createdUser.id;

    let profile;

    try {
      profile = await loadUserProfile(createdUser.id);
    } catch (profileError) {
      const { error: insertProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: createdUser.id,
          tenant_id: targetTenantId,
          role,
          full_name: fullName,
          email,
          is_active: true,
        });

      if (insertProfileError) throw insertProfileError;

      profile = await loadUserProfile(createdUser.id);
    }

    res.status(201).json({
      user: {
        id: createdUser.id,
        email: createdUser.email,
      },
      profile,
      tenant: createdTenant,
    });
  } catch (error) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }

    if (createdTenantInThisRequest && createdTenant) {
      await supabase.from('tenants').delete().eq('id', createdTenant.id);
    }

    next(error);
  }
});

module.exports = router;
