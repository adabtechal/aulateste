const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const kestraApi = require('../services/kestraApi');
const {
  DEFAULT_CONFIG,
  normalizeConfig,
  toRow,
  fromRow,
  buildExecutionPayload,
  buildKestraFlowYaml,
} = require('../services/tenantBotConfigService');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('superadmin', 'tenant_admin'));

async function resolveTargetTenant(req) {
  const actor = req.auth.profile;
  const requestedTenantId = req.query.tenantId || req.body?.tenantId || null;
  const tenantId = actor.role === 'superadmin' ? requestedTenantId : actor.tenant_id;

  if (!tenantId) {
    throw Object.assign(new Error('Selecione uma tenant para configurar o agente'), { statusCode: 400 });
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, is_active')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    throw Object.assign(new Error('Tenant não encontrada'), { statusCode: 404 });
  }

  return tenant;
}

async function loadConfigRow(tenantId) {
  const { data, error } = await supabase
    .from('tenant_bot_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

router.get('/', async (req, res, next) => {
  try {
    const tenant = await resolveTargetTenant(req);
    const row = await loadConfigRow(tenant.id);
    const config = row ? fromRow(row, tenant) : { ...DEFAULT_CONFIG };

    res.json({
      tenant,
      config,
      generated: {
        flowYaml: buildKestraFlowYaml(config, tenant),
        executionPayload: buildExecutionPayload(config, tenant),
      },
      meta: row
        ? {
            lastPublishedAt: row.last_published_at,
            lastPublishedFlowRevision: row.last_published_flow_revision,
            lastPublishedBy: row.last_published_by,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const tenant = await resolveTargetTenant(req);
    const config = normalizeConfig(req.body?.config || {});
    const payload = toRow(tenant.id, config);

    const { data, error } = await supabase
      .from('tenant_bot_configs')
      .upsert(payload, { onConflict: 'tenant_id' })
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      tenant,
      config: fromRow(data, tenant),
      generated: {
        flowYaml: buildKestraFlowYaml(config, tenant),
        executionPayload: buildExecutionPayload(config, tenant),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/publish', async (req, res, next) => {
  try {
    const tenant = await resolveTargetTenant(req);
    const existing = await loadConfigRow(tenant.id);
    const config = normalizeConfig(req.body?.config || (existing ? fromRow(existing, tenant) : DEFAULT_CONFIG));
    const source = buildKestraFlowYaml(config, tenant);
    const published = await kestraApi.upsertFlow(source);

    const revision =
      published?.revision ??
      published?.flow?.revision ??
      published?.data?.revision ??
      null;

    const { data, error } = await supabase
      .from('tenant_bot_configs')
      .upsert(
        {
          ...toRow(tenant.id, config, req.auth.user.id),
          last_published_at: new Date().toISOString(),
          last_published_flow_revision: revision,
        },
        { onConflict: 'tenant_id' }
      )
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      tenant,
      config: fromRow(data, tenant),
      generated: {
        flowYaml: source,
        executionPayload: buildExecutionPayload(config, tenant),
      },
      published,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
