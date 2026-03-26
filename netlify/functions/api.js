const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

// Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// ─── Express App ───
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Export handler
module.exports.handler = serverless(app);
