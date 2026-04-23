const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

// Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

// Evolution API service
const axios = require('axios');
let evolutionClient = null;
const evoUrl = process.env.EVOLUTION_API_URL;
const evoKey = process.env.EVOLUTION_API_KEY;
if (evoUrl && evoKey) {
  evolutionClient = axios.create({
    baseURL: evoUrl,
    headers: { apikey: evoKey },
    timeout: 30000
  });
}

// ─── Helper functions ───
async function getActiveInstance() {
  const { data } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('status', 'connected')
    .limit(1)
    .single();
  return data;
}

async function sendTextMessage(leadId, text) {
  const instance = await getActiveInstance();
  if (!instance) throw Object.assign(new Error('Nenhuma instância WhatsApp conectada'), { statusCode: 400 });

  const { data: lead } = await supabase.from('leads').select('phone').eq('id', leadId).single();
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  if (!evolutionClient) throw Object.assign(new Error('Evolution API not configured'), { statusCode: 503 });

  const { data: result } = await evolutionClient.post(`/message/sendText/${instance.instance_name}`, {
    number: lead.phone, text, delay: 1000, linkPreview: false
  });

  await supabase.from('message_log').insert({
    lead_id: leadId, direction: 'outgoing', message_type: 'text',
    content: text, whatsapp_message_id: result?.key?.id, status: 'sent'
  });
  return result;
}

async function sendMediaMessage(leadId, mediaUrl, caption, mimetype) {
  const instance = await getActiveInstance();
  if (!instance) throw Object.assign(new Error('Nenhuma instância WhatsApp conectada'), { statusCode: 400 });

  const { data: lead } = await supabase.from('leads').select('phone').eq('id', leadId).single();
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  if (!evolutionClient) throw Object.assign(new Error('Evolution API not configured'), { statusCode: 503 });

  const { data: result } = await evolutionClient.post(`/message/sendMedia/${instance.instance_name}`, {
    number: lead.phone, mediatype: 'image', mimetype: mimetype || 'image/png',
    caption, media: mediaUrl, fileName: 'image.png'
  });

  await supabase.from('message_log').insert({
    lead_id: leadId, direction: 'outgoing', message_type: 'image',
    content: caption, media_url: mediaUrl, whatsapp_message_id: result?.key?.id, status: 'sent'
  });
  return result;
}

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

// ─── Express App ───
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Token de autenticacao ausente' });
    }

    const token = authorization.slice(7);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: true, message: 'Sessao invalida ou expirada' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: true, message: 'Perfil de usuario nao encontrado' });
    }

    req.auth = { token, user, profile };
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.profile || !allowedRoles.includes(req.auth.profile.role)) {
      return res.status(403).json({ error: true, message: 'Acesso negado para este perfil' });
    }

    next();
  };
}

const usersRouter = express.Router();
usersRouter.use(requireAuth);

// Health
app.get('/api/health', async (req, res) => {
  const { error } = await supabase.from('kanban_stages').select('id').limit(1);
  res.json({ status: 'ok', timestamp: new Date().toISOString(), supabase: error ? 'error' : 'connected' });
});

// ─── STAGES ───
app.get('/api/stages', async (req, res) => {
  const { data, error } = await supabase.from('kanban_stages').select('*').order('position');
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.post('/api/stages', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: true, message: 'Name is required' });

  const { data: maxPos } = await supabase.from('kanban_stages').select('position').order('position', { ascending: false }).limit(1).single();
  const position = (maxPos?.position ?? -1) + 1;

  const { data, error } = await supabase.from('kanban_stages').insert({ name, color: color || '#6B7280', position }).select().single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.status(201).json(data);
});

app.put('/api/stages/:id', async (req, res) => {
  const { name, color } = req.body;
  const { data, error } = await supabase.from('kanban_stages').update({ name, color, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.delete('/api/stages/:id', async (req, res) => {
  const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('current_stage_id', req.params.id);
  if (count > 0) return res.status(400).json({ error: true, message: `Cannot delete stage with ${count} leads. Move them first.` });

  const { error } = await supabase.from('kanban_stages').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json({ success: true });
});

app.patch('/api/stages/reorder', async (req, res) => {
  const { stages } = req.body;
  if (!Array.isArray(stages)) return res.status(400).json({ error: true, message: 'stages array required' });

  for (const { id, position } of stages) {
    await supabase.from('kanban_stages').update({ position }).eq('id', id);
  }
  const { data } = await supabase.from('kanban_stages').select('*').order('position');
  res.json(data);
});

// ─── LEADS ───
app.get('/api/leads', async (req, res) => {
  const { page = 1, limit = 20, search, stage, tags } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase.from('leads').select('*, kanban_stages(name, color)', { count: 'exact' });
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  if (stage) query = query.eq('current_stage_id', stage);
  if (tags) query = query.overlaps('tags', tags.split(','));

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ error: true, message: error.message });

  res.json({ data, pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / limit) } });
});

app.get('/api/leads/:id', async (req, res) => {
  const { data: lead, error } = await supabase.from('leads').select('*, kanban_stages(name, color)').eq('id', req.params.id).single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  if (!lead) return res.status(404).json({ error: true, message: 'Lead not found' });

  const { data: history } = await supabase.from('lead_stage_history')
    .select('*, from_stage:kanban_stages!from_stage_id(name, color), to_stage:kanban_stages!to_stage_id(name, color)')
    .eq('lead_id', req.params.id).order('moved_at', { ascending: false });

  res.json({ ...lead, stage_history: history || [] });
});

app.post('/api/leads', async (req, res) => {
  const { name, phone, email, company, tags, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: true, message: 'Name and phone are required' });

  const { data: firstStage } = await supabase.from('kanban_stages').select('id').eq('is_active', true).order('position').limit(1).single();

  const { data: lead, error } = await supabase.from('leads')
    .insert({ name, phone, email, company, tags: tags || [], notes, current_stage_id: firstStage?.id })
    .select('*, kanban_stages(name, color)').single();

  if (error) return res.status(500).json({ error: true, message: error.message });

  if (firstStage?.id) {
    await supabase.from('lead_stage_history').insert({ lead_id: lead.id, from_stage_id: null, to_stage_id: firstStage.id });
  }
  res.status(201).json(lead);
});

app.put('/api/leads/:id', async (req, res) => {
  const { name, phone, email, company, tags, notes } = req.body;
  const { data, error } = await supabase.from('leads')
    .update({ name, phone, email, company, tags, notes, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select('*, kanban_stages(name, color)').single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.delete('/api/leads/:id', async (req, res) => {
  const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json({ success: true });
});

app.patch('/api/leads/:id/stage', async (req, res) => {
  const { stageId } = req.body;
  if (!stageId) return res.status(400).json({ error: true, message: 'stageId is required' });

  const { data: current } = await supabase.from('leads').select('current_stage_id').eq('id', req.params.id).single();
  if (current?.current_stage_id === stageId) return res.json({ message: 'Lead already in this stage' });

  const { data: lead, error } = await supabase.from('leads')
    .update({ current_stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select('*, kanban_stages(name, color)').single();
  if (error) return res.status(500).json({ error: true, message: error.message });

  const { data: historyEntry } = await supabase.from('lead_stage_history')
    .insert({ lead_id: req.params.id, from_stage_id: current?.current_stage_id, to_stage_id: stageId }).select().single();

  if (current?.current_stage_id) {
    await supabase.from('scheduled_messages').update({ status: 'cancelled' })
      .match({ lead_id: req.params.id, stage_id: current.current_stage_id, status: 'pending' });
  }

  const { data: autoMessages } = await supabase.from('auto_messages').select('*').eq('stage_id', stageId).eq('is_active', true);
  if (autoMessages?.length) {
    const scheduled = autoMessages.map(am => ({
      lead_id: req.params.id, auto_message_id: am.id, stage_id: stageId,
      scheduled_at: new Date(Date.now() + am.delay_minutes * 60000).toISOString(), status: 'pending'
    }));
    await supabase.from('scheduled_messages').insert(scheduled);
  }

  res.json({ lead, history_entry: historyEntry });
});

app.patch('/api/leads/:id/pause-followup', async (req, res) => {
  const { data: current } = await supabase.from('leads').select('auto_followup_paused').eq('id', req.params.id).single();
  const { data, error } = await supabase.from('leads').update({ auto_followup_paused: !current.auto_followup_paused }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

// ─── MESSAGES ───
app.get('/api/messages', async (req, res) => {
  const { page = 1, limit = 50, lead, type, direction, from, to } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase.from('message_log').select('*, leads(name, phone)', { count: 'exact' });
  if (lead) query = query.eq('lead_id', lead);
  if (type) query = query.eq('message_type', type);
  if (direction) query = query.eq('direction', direction);
  if (from) query = query.gte('sent_at', from);
  if (to) query = query.lte('sent_at', to);

  const { data, error, count } = await query.order('sent_at', { ascending: false }).range(offset, offset + Number(limit) - 1);
  if (error) return res.status(500).json({ error: true, message: error.message });

  res.json({ data, pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / limit) } });
});

app.get('/api/messages/export', async (req, res) => {
  const { lead, type, direction, from, to } = req.query;
  let query = supabase.from('message_log').select('*, leads(name, phone)');
  if (lead) query = query.eq('lead_id', lead);
  if (type) query = query.eq('message_type', type);
  if (direction) query = query.eq('direction', direction);
  if (from) query = query.gte('sent_at', from);
  if (to) query = query.lte('sent_at', to);

  const { data, error } = await query.order('sent_at', { ascending: false });
  if (error) return res.status(500).json({ error: true, message: error.message });

  const directionLabel = { outgoing: 'Enviada', incoming: 'Recebida', auto: 'Automática' };
  const csv = [
    'Data,Lead,Telefone,Direção,Tipo,Conteúdo,Status',
    ...data.map(m =>
      `"${m.sent_at}","${m.leads?.name || ''}","${m.leads?.phone || ''}","${directionLabel[m.direction] || m.direction}","${m.message_type}","${(m.content || '').replace(/"/g, '""')}","${m.status}"`
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=messages-export.csv');
  res.send(csv);
});

app.get('/api/messages/lead/:leadId', async (req, res) => {
  const { data, error } = await supabase.from('message_log').select('*').eq('lead_id', req.params.leadId).order('sent_at', { ascending: true });
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.post('/api/messages/send-text', async (req, res) => {
  const { leadId, text } = req.body;
  if (!leadId || !text) return res.status(400).json({ error: true, message: 'leadId and text are required' });
  try {
    const result = await sendTextMessage(leadId, text);
    res.json({ success: true, result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: true, message: err.message });
  }
});

app.post('/api/messages/send-media', async (req, res) => {
  const { leadId, mediaUrl, caption, mimetype } = req.body;
  if (!leadId || !mediaUrl) return res.status(400).json({ error: true, message: 'leadId and mediaUrl are required' });
  try {
    const result = await sendMediaMessage(leadId, mediaUrl, caption || '', mimetype);
    res.json({ success: true, result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: true, message: err.message });
  }
});

// ─── WHATSAPP ───
app.get('/api/whatsapp/instances', async (req, res) => {
  const { data, error } = await supabase.from('whatsapp_instances').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.post('/api/whatsapp/instances', async (req, res) => {
  const { instanceName } = req.body;
  if (!instanceName) return res.status(400).json({ error: true, message: 'instanceName is required' });
  if (!evolutionClient) return res.status(503).json({ error: true, message: 'Evolution API not configured' });

  try {
    const { data: evoResult } = await evolutionClient.post('/instance/create', {
      instanceName, integration: 'WHATSAPP-BAILEYS', qrcode: true,
      rejectCall: false, groupsIgnore: true, alwaysOnline: false, readMessages: false, readStatus: false, syncFullHistory: false
    });

    const { data, error } = await supabase.from('whatsapp_instances')
      .insert({ instance_name: instanceName, api_url: evoUrl, api_key: evoKey, status: 'disconnected' }).select().single();
    if (error) return res.status(500).json({ error: true, message: error.message });

    if (process.env.WEBHOOK_URL) {
      try {
        await evolutionClient.post(`/webhook/set/${instanceName}`, {
          enabled: true, url: process.env.WEBHOOK_URL, webhookByEvents: true, webhookBase64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
        });
      } catch (e) { /* webhook config failed, non-blocking */ }
    }

    res.status(201).json({ instance: data, evolution: evoResult });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

app.get('/api/whatsapp/instances/:name/qrcode', async (req, res) => {
  if (!evolutionClient) return res.status(503).json({ error: true, message: 'Evolution API not configured' });
  try {
    const { data } = await evolutionClient.get(`/instance/connect/${req.params.name}`);
    res.json(data);
  } catch (err) { res.status(500).json({ error: true, message: err.message }); }
});

app.get('/api/whatsapp/instances/:name/status', async (req, res) => {
  if (!evolutionClient) return res.status(503).json({ error: true, message: 'Evolution API not configured' });
  try {
    const { data } = await evolutionClient.get(`/instance/connectionState/${req.params.name}`);
    const state = data?.instance?.state;
    await supabase.from('whatsapp_instances')
      .update({ status: state === 'open' ? 'connected' : 'disconnected', updated_at: new Date().toISOString() })
      .eq('instance_name', req.params.name);
    res.json({ state, instanceName: req.params.name });
  } catch (err) { res.status(500).json({ error: true, message: err.message }); }
});

app.delete('/api/whatsapp/instances/:name', async (req, res) => {
  if (evolutionClient) {
    try { await evolutionClient.delete(`/instance/delete/${req.params.name}`); } catch (e) { /* non-blocking */ }
  }
  const { error } = await supabase.from('whatsapp_instances').delete().eq('instance_name', req.params.name);
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json({ success: true });
});

app.post('/api/whatsapp/instances/:name/reconnect', async (req, res) => {
  if (!evolutionClient) return res.status(503).json({ error: true, message: 'Evolution API not configured' });
  try {
    const { data } = await evolutionClient.get(`/instance/connect/${req.params.name}`);
    res.json(data);
  } catch (err) { res.status(500).json({ error: true, message: err.message }); }
});

// ─── AUTO MESSAGES ───
app.get('/api/auto-messages/stage/:stageId', async (req, res) => {
  const { data, error } = await supabase.from('auto_messages').select('*').eq('stage_id', req.params.stageId).order('position');
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.post('/api/auto-messages', async (req, res) => {
  const { stage_id, message_template, message_type, media_url, delay_minutes, is_active, position } = req.body;
  if (!stage_id || !message_template || delay_minutes == null) return res.status(400).json({ error: true, message: 'stage_id, message_template, and delay_minutes are required' });

  const { data, error } = await supabase.from('auto_messages')
    .insert({ stage_id, message_template, message_type: message_type || 'text', media_url, delay_minutes, is_active: is_active !== false, position: position || 0 }).select().single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.status(201).json(data);
});

app.put('/api/auto-messages/:id', async (req, res) => {
  const { message_template, message_type, media_url, delay_minutes, is_active, position } = req.body;
  const { data, error } = await supabase.from('auto_messages')
    .update({ message_template, message_type, media_url, delay_minutes, is_active, position }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

app.delete('/api/auto-messages/:id', async (req, res) => {
  const { error } = await supabase.from('auto_messages').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json({ success: true });
});

app.patch('/api/auto-messages/:id/toggle', async (req, res) => {
  const { data: current } = await supabase.from('auto_messages').select('is_active').eq('id', req.params.id).single();
  const { data, error } = await supabase.from('auto_messages').update({ is_active: !current.is_active }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: true, message: error.message });
  res.json(data);
});

usersRouter.get('/me', async (req, res) => {
  res.json(req.auth.profile);
});

usersRouter.get('/tenants', requireRole('superadmin', 'tenant_admin'), async (req, res) => {
  let query = supabase
    .from('tenants')
    .select('*')
    .order('name', { ascending: true });

  if (req.auth.profile.role === 'tenant_admin') {
    query = query.eq('id', req.auth.profile.tenant_id);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: true, message: error.message });
  }

  res.json(data || []);
});

usersRouter.get('/', requireRole('superadmin', 'tenant_admin'), async (req, res) => {
  let query = supabase
    .from('user_profiles')
    .select('*, tenant:tenants(*)')
    .order('created_at', { ascending: false });

  if (req.auth.profile.role === 'tenant_admin') {
    query = query.eq('tenant_id', req.auth.profile.tenant_id);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: true, message: error.message });
  }

  res.json(data || []);
});

usersRouter.post('/', requireRole('superadmin', 'tenant_admin'), async (req, res) => {
  if (!hasServiceRoleKey) {
    return res.status(503).json({
      error: true,
      message: 'SUPABASE_SERVICE_ROLE_KEY nao configurada no deploy',
    });
  }

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
      return res.status(400).json({ error: true, message: 'Nome, email, senha e perfil sao obrigatorios' });
    }

    if (!['tenant_admin', 'tenant_user'].includes(role)) {
      return res.status(400).json({ error: true, message: 'Perfil invalido para criacao de usuario' });
    }

    let targetTenantId = tenantId || null;

    if (actor.role === 'tenant_admin') {
      if (role !== 'tenant_user') {
        return res.status(403).json({ error: true, message: 'Administrador de tenant so pode criar usuarios da propria tenant' });
      }

      targetTenantId = actor.tenant_id;
    }

    if (actor.role === 'superadmin' && role === 'tenant_admin') {
      if (!tenantName) {
        return res.status(400).json({ error: true, message: 'Nome da tenant e obrigatorio para criar um administrador' });
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
      return res.status(400).json({ error: true, message: 'Tenant obrigatoria para criar usuarios comuns' });
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
          message: 'A tenant selecionada ja atingiu o limite maximo de usuarios',
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

    if (authError) throw authError;

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

    res.status(error.status || error.statusCode || 500).json({
      error: true,
      message: error.message || 'Internal server error',
    });
  }
});

app.use('/api/users', usersRouter);

// ─── WEBHOOK ───
app.post('/api/webhook/messages', async (req, res) => {
  try {
    const { event, data } = req.body;
    if (event === 'messages.upsert') {
      const message = data;
      if (message?.key?.fromMe) return res.status(200).json({ received: true });

      const remoteJid = message?.key?.remoteJid || '';
      const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      if (remoteJid.includes('@g.us')) return res.status(200).json({ received: true, skipped: 'group' });

      const pushName = message?.pushName || message?.verifiedBizName || '';
      const msg = message.message || {};
      const isImage = !!msg.imageMessage;
      const content = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || '';

      const { data: existingLead } = await supabase.from('leads').select('id').eq('phone', phone).maybeSingle();
      let leadId;

      if (existingLead) {
        leadId = existingLead.id;
      } else {
        const { data: firstStage } = await supabase.from('kanban_stages').select('id').eq('is_active', true).order('position').limit(1).single();
        if (!firstStage) return res.status(200).json({ received: true, error: 'no_active_stage' });

        const { data: newLead, error: leadError } = await supabase.from('leads')
          .insert({ name: pushName || phone, phone, current_stage_id: firstStage.id, tags: ['novo-whatsapp'] }).select('id').single();

        if (leadError) {
          if (leadError.code === '23505') {
            const { data: retryLead } = await supabase.from('leads').select('id').eq('phone', phone).single();
            leadId = retryLead?.id;
          } else {
            return res.status(200).json({ received: true, error: leadError.message });
          }
        } else {
          leadId = newLead.id;
          await supabase.from('lead_stage_history').insert({ lead_id: leadId, from_stage_id: null, to_stage_id: firstStage.id });

          const { data: autoMessages } = await supabase.from('auto_messages').select('*').eq('stage_id', firstStage.id).eq('is_active', true);
          if (autoMessages?.length) {
            const scheduled = autoMessages.map(am => ({
              lead_id: leadId, auto_message_id: am.id, stage_id: firstStage.id,
              scheduled_at: new Date(Date.now() + am.delay_minutes * 60000).toISOString(), status: 'pending'
            }));
            await supabase.from('scheduled_messages').insert(scheduled);
          }
        }
      }

      if (leadId) {
        await supabase.from('message_log').insert({
          lead_id: leadId, direction: 'incoming', message_type: isImage ? 'image' : 'text',
          content, media_url: msg.imageMessage?.url || null, whatsapp_message_id: message.key?.id, status: 'received'
        });
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(200).json({ received: true, error: err.message });
  }
});

// ─── KESTRA API SERVICE ───
const kestraApiUrl = process.env.KESTRA_API_URL;
const kestraUsername = process.env.KESTRA_USERNAME;
const kestraPassword = process.env.KESTRA_PASSWORD;
const kestraTenant = process.env.KESTRA_TENANT || 'main';

let kestraClient = null;
if (kestraApiUrl && kestraUsername && kestraPassword) {
  kestraClient = axios.create({
    baseURL: kestraApiUrl.replace(/\/+$/, ''),
    auth: { username: kestraUsername, password: kestraPassword },
    timeout: 30000
  });
}

async function kestraRequestWithFallback({ method, pathWithTenant, pathWithoutTenant, params, data, headers }) {
  if (!kestraClient) throw Object.assign(new Error('Kestra API not configured'), { statusCode: 503 });
  try {
    const response = await kestraClient.request({ method, url: pathWithTenant, params, data, headers });
    return response.data;
  } catch (error) {
    if (error.response?.status !== 404 || !pathWithoutTenant) throw error;
    const response = await kestraClient.request({ method, url: pathWithoutTenant, params, data, headers });
    return response.data;
  }
}

function extractFlowIdentity(source = '') {
  const namespace = source.match(/^\s*namespace:\s*([^\r\n]+)/m)?.[1]?.trim();
  const id = source.match(/^\s*id:\s*([^\r\n]+)/m)?.[1]?.trim();
  return namespace && id ? { namespace, id } : null;
}

// ─── KESTRA ROUTES ───
app.get('/api/kestra/health', async (req, res) => {
  try {
    const data = await kestraRequestWithFallback({
      method: 'get',
      pathWithTenant: `/api/v1/${kestraTenant}/flows/search`,
      pathWithoutTenant: '/api/v1/flows/search',
      params: { page: 1, size: 1 }
    });
    res.json({ connected: true, baseURL: kestraApiUrl, tenant: kestraTenant, authMode: 'basic', sample: data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ connected: false, error: err.message });
  }
});

app.post('/api/kestra/executions/:namespace/:flowId', requireAuth, async (req, res) => {
  try {
    const { namespace, flowId } = req.params;
    const { wait = false, inputs, labels } = req.body || {};
    const data = await kestraRequestWithFallback({
      method: 'post',
      pathWithTenant: `/api/v1/${kestraTenant}/executions/${namespace}/${flowId}`,
      pathWithoutTenant: `/api/v1/executions/${namespace}/${flowId}`,
      params: { wait: wait === true || wait === 'true' },
      data: { ...(inputs ? { inputs } : {}), ...(labels ? { labels } : {}) }
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: true, message: err.message });
  }
});

app.post('/api/kestra/flows', requireAuth, async (req, res) => {
  try {
    const { source } = req.body || {};
    if (!source || typeof source !== 'string') return res.status(400).json({ error: true, message: 'source is required' });

    let data;
    try {
      data = await kestraRequestWithFallback({
        method: 'post',
        pathWithTenant: `/api/v1/${kestraTenant}/flows`,
        pathWithoutTenant: '/api/v1/flows',
        data: source,
        headers: { 'Content-Type': 'application/x-yaml' }
      });
    } catch (error) {
      const alreadyExists = error.response?.status === 422 && /already exists/i.test(error.response?.data?.message || '');
      const identity = extractFlowIdentity(source);
      if (!alreadyExists || !identity) throw error;
      data = await kestraRequestWithFallback({
        method: 'put',
        pathWithTenant: `/api/v1/${kestraTenant}/flows/${identity.namespace}/${identity.id}`,
        pathWithoutTenant: `/api/v1/flows/${identity.namespace}/${identity.id}`,
        data: source,
        headers: { 'Content-Type': 'application/x-yaml' }
      });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: true, message: err.message });
  }
});

// ─── BOT CONFIG SERVICE ───
const PROVIDER_TYPE_MAP = {
  openai: 'io.kestra.plugin.ai.provider.OpenAI',
  anthropic: 'io.kestra.plugin.ai.provider.Anthropic',
  mistral: 'io.kestra.plugin.ai.provider.MistralAI',
  openrouter: 'io.kestra.plugin.ai.provider.OpenRouter',
};
const TOOL_IDS = ['web_search', 'flow_call', 'task_run', 'crm_lookup'];
const BOT_DEFAULT_CONFIG = {
  enabled: true, agentName: 'Atendimento WhatsApp', namespace: 'company.bot',
  flowId: 'tenant-conversation-agent', whatsappInstance: '', webhookPath: '/api/webhook/messages',
  provider: 'openai', providerApiKey: '', model: 'gpt-4.1-mini', temperature: 0.3, maxTokens: 900,
  maxSequentialToolsInvocations: 6, memoryEnabled: true, memoryKey: 'lead_phone',
  welcomeMessage: 'Ola! Sou o assistente virtual da operacao.', systemPrompt: 'Voce e o agente conversacional oficial desta tenant.',
  executionLabels: { channel: 'whatsapp', source: 'leadtrack' },
  handoffInstructions: 'Quando a conversa indicar urgencia comercial, encaminhe para a equipe.',
  safetyNotes: 'Nao compartilhar dados internos.', tools: ['web_search', 'flow_call', 'task_run', 'crm_lookup'],
  lastPublishedAt: null, lastPublishedFlowRevision: null, lastPublishedBy: null,
};

function normalizeLabels(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...BOT_DEFAULT_CONFIG.executionLabels };
  return Object.entries(value).reduce((acc, [k, v]) => { if (k && v !== undefined && v !== null && String(v).trim()) acc[k] = String(v).trim(); return acc; }, {});
}
function normalizeTools(value) {
  if (!Array.isArray(value)) return [...BOT_DEFAULT_CONFIG.tools];
  const unique = Array.from(new Set(value.filter(t => TOOL_IDS.includes(t))));
  return unique.length > 0 ? unique : [...BOT_DEFAULT_CONFIG.tools];
}
function normalizeBotConfig(p = {}) {
  const provider = PROVIDER_TYPE_MAP[p.provider] ? p.provider : BOT_DEFAULT_CONFIG.provider;
  return {
    enabled: p.enabled !== undefined ? Boolean(p.enabled) : BOT_DEFAULT_CONFIG.enabled,
    agentName: p.agentName?.trim() || BOT_DEFAULT_CONFIG.agentName,
    namespace: p.namespace?.trim() || BOT_DEFAULT_CONFIG.namespace,
    flowId: p.flowId?.trim() || BOT_DEFAULT_CONFIG.flowId,
    whatsappInstance: p.whatsappInstance?.trim() || '', webhookPath: p.webhookPath?.trim() || BOT_DEFAULT_CONFIG.webhookPath,
    provider, providerApiKey: p.providerApiKey?.trim() || '', model: p.model?.trim() || BOT_DEFAULT_CONFIG.model,
    temperature: Number.isFinite(Number(p.temperature)) ? Number(p.temperature) : BOT_DEFAULT_CONFIG.temperature,
    maxTokens: Number.isFinite(Number(p.maxTokens)) ? Number(p.maxTokens) : BOT_DEFAULT_CONFIG.maxTokens,
    maxSequentialToolsInvocations: Number.isFinite(Number(p.maxSequentialToolsInvocations)) ? Number(p.maxSequentialToolsInvocations) : BOT_DEFAULT_CONFIG.maxSequentialToolsInvocations,
    memoryEnabled: p.memoryEnabled !== undefined ? Boolean(p.memoryEnabled) : BOT_DEFAULT_CONFIG.memoryEnabled,
    memoryKey: p.memoryKey?.trim() || BOT_DEFAULT_CONFIG.memoryKey,
    welcomeMessage: p.welcomeMessage?.trim() || BOT_DEFAULT_CONFIG.welcomeMessage,
    systemPrompt: p.systemPrompt?.trim() || BOT_DEFAULT_CONFIG.systemPrompt,
    executionLabels: normalizeLabels(p.executionLabels), handoffInstructions: p.handoffInstructions?.trim() || BOT_DEFAULT_CONFIG.handoffInstructions,
    safetyNotes: p.safetyNotes?.trim() || BOT_DEFAULT_CONFIG.safetyNotes, tools: normalizeTools(p.tools),
    lastPublishedAt: p.lastPublishedAt || null, lastPublishedFlowRevision: p.lastPublishedFlowRevision ?? null, lastPublishedBy: p.lastPublishedBy || null,
  };
}
function botConfigToRow(tenantId, config, userId = null) {
  return {
    tenant_id: tenantId, enabled: config.enabled, agent_name: config.agentName, namespace: config.namespace,
    flow_id: config.flowId, whatsapp_instance: config.whatsappInstance || null, webhook_path: config.webhookPath,
    provider: config.provider, provider_api_key: config.providerApiKey || null, model: config.model,
    temperature: config.temperature, max_tokens: config.maxTokens, max_sequential_tools_invocations: config.maxSequentialToolsInvocations,
    memory_enabled: config.memoryEnabled, memory_key: config.memoryKey, welcome_message: config.welcomeMessage,
    system_prompt: config.systemPrompt, execution_labels: config.executionLabels, handoff_instructions: config.handoffInstructions,
    safety_notes: config.safetyNotes, tools: config.tools, ...(userId ? { last_published_by: userId } : {}),
  };
}
function botConfigFromRow(row, tenant = null) {
  if (!row) return null;
  return normalizeBotConfig({
    enabled: row.enabled, agentName: row.agent_name, namespace: row.namespace, flowId: row.flow_id,
    whatsappInstance: row.whatsapp_instance, webhookPath: row.webhook_path, provider: row.provider,
    providerApiKey: row.provider_api_key, model: row.model, temperature: row.temperature, maxTokens: row.max_tokens,
    maxSequentialToolsInvocations: row.max_sequential_tools_invocations, memoryEnabled: row.memory_enabled,
    memoryKey: row.memory_key, welcomeMessage: row.welcome_message, systemPrompt: row.system_prompt,
    executionLabels: row.execution_labels, handoffInstructions: row.handoff_instructions, safetyNotes: row.safety_notes,
    tools: row.tools, lastPublishedAt: row.last_published_at, lastPublishedFlowRevision: row.last_published_flow_revision,
    lastPublishedBy: row.last_published_by, tenant,
  });
}
function buildExecutionPayload(config, tenant) {
  return { wait: false, inputs: { tenantId: tenant.id, phone: '{{incoming_phone}}', incomingMessage: '{{incoming_message}}' },
    labels: { tenant: tenant.name, tenantSlug: tenant.slug, whatsappInstance: config.whatsappInstance || 'not-configured', agentEnabled: String(config.enabled), ...config.executionLabels } };
}
function buildWebhookTriggerKey(config, tenant) {
  return `${tenant.slug}-${config.flowId}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}
function buildKestraFlowYaml(config, tenant) {
  const providerType = PROVIDER_TYPE_MAP[config.provider] || PROVIDER_TYPE_MAP.openai;
  const webhookKey = buildWebhookTriggerKey(config, tenant);
  return `id: ${config.flowId}\nnamespace: ${config.namespace}\n\ninputs:\n  - id: tenantId\n    type: STRING\n  - id: phone\n    type: STRING\n  - id: incomingMessage\n    type: STRING\n\ntriggers:\n  - id: whatsapp_webhook\n    type: io.kestra.plugin.core.trigger.Webhook\n    key: "${webhookKey}"\n\ntasks:\n  - id: tenant_agent\n    type: io.kestra.plugin.ai.agent.AIAgent\n    systemMessage: |\n      ${config.systemPrompt.split('\n').join('\n      ')}\n    prompt: |\n      Tenant: ${tenant.name} (${tenant.slug})\n      Telefone: {{ inputs.phone }}\n      Mensagem recebida: {{ inputs.incomingMessage }}\n    provider:\n      type: ${providerType}\n${config.providerApiKey ? `      apiKey: "${config.providerApiKey}"\n` : ''}      modelName: "${config.model}"\n    configuration:\n      temperature: ${config.temperature}\n      maxToken: ${config.maxTokens}\n    maxSequentialToolsInvocations: ${config.maxSequentialToolsInvocations}\n    tools: []`;
}

async function resolveTargetTenant(req) {
  const actor = req.auth.profile;
  const requestedTenantId = req.query.tenantId || req.body?.tenantId || null;
  const tenantId = actor.role === 'superadmin' ? requestedTenantId : actor.tenant_id;
  if (!tenantId) throw Object.assign(new Error('Selecione uma tenant'), { statusCode: 400 });
  const { data: tenant, error } = await supabase.from('tenants').select('id, name, slug, plan, is_active').eq('id', tenantId).single();
  if (error || !tenant) throw Object.assign(new Error('Tenant nao encontrada'), { statusCode: 404 });
  return tenant;
}

// ─── BOT CONFIG ROUTES ───
app.get('/api/bot-config', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res) => {
  try {
    const tenant = await resolveTargetTenant(req);
    const { data: row } = await supabase.from('tenant_bot_configs').select('*').eq('tenant_id', tenant.id).maybeSingle();
    const config = row ? botConfigFromRow(row, tenant) : { ...BOT_DEFAULT_CONFIG };
    res.json({ tenant, config, generated: { flowYaml: buildKestraFlowYaml(config, tenant), executionPayload: buildExecutionPayload(config, tenant) },
      meta: row ? { lastPublishedAt: row.last_published_at, lastPublishedFlowRevision: row.last_published_flow_revision, lastPublishedBy: row.last_published_by } : null });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: true, message: error.message });
  }
});

app.put('/api/bot-config', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res) => {
  try {
    const tenant = await resolveTargetTenant(req);
    const config = normalizeBotConfig(req.body?.config || {});
    const payload = botConfigToRow(tenant.id, config);
    const { data, error } = await supabase.from('tenant_bot_configs').upsert(payload, { onConflict: 'tenant_id' }).select('*').single();
    if (error) throw error;
    res.json({ tenant, config: botConfigFromRow(data, tenant), generated: { flowYaml: buildKestraFlowYaml(config, tenant), executionPayload: buildExecutionPayload(config, tenant) } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: true, message: error.message });
  }
});

app.post('/api/bot-config/publish', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res) => {
  try {
    const tenant = await resolveTargetTenant(req);
    const { data: existing } = await supabase.from('tenant_bot_configs').select('*').eq('tenant_id', tenant.id).maybeSingle();
    const config = normalizeBotConfig(req.body?.config || (existing ? botConfigFromRow(existing, tenant) : BOT_DEFAULT_CONFIG));
    const source = buildKestraFlowYaml(config, tenant);

    let published;
    try {
      published = await kestraRequestWithFallback({ method: 'post', pathWithTenant: `/api/v1/${kestraTenant}/flows`, pathWithoutTenant: '/api/v1/flows', data: source, headers: { 'Content-Type': 'application/x-yaml' } });
    } catch (error) {
      const alreadyExists = error.response?.status === 422 && /already exists/i.test(error.response?.data?.message || '');
      const identity = extractFlowIdentity(source);
      if (!alreadyExists || !identity) throw error;
      published = await kestraRequestWithFallback({ method: 'put', pathWithTenant: `/api/v1/${kestraTenant}/flows/${identity.namespace}/${identity.id}`, pathWithoutTenant: `/api/v1/flows/${identity.namespace}/${identity.id}`, data: source, headers: { 'Content-Type': 'application/x-yaml' } });
    }

    const revision = published?.revision ?? published?.flow?.revision ?? published?.data?.revision ?? null;
    const { data, error } = await supabase.from('tenant_bot_configs').upsert({ ...botConfigToRow(tenant.id, config, req.auth.user.id), last_published_at: new Date().toISOString(), last_published_flow_revision: revision }, { onConflict: 'tenant_id' }).select('*').single();
    if (error) throw error;
    res.json({ tenant, config: botConfigFromRow(data, tenant), generated: { flowYaml: source, executionPayload: buildExecutionPayload(config, tenant) }, published });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: true, message: error.message });
  }
});

// Export handler
module.exports.handler = serverless(app);
