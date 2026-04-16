const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const evolutionApi = require('../services/evolutionApi');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('superadmin', 'tenant_admin'));

function resolveTenantId(req) {
  if (req.auth.profile.role === 'superadmin') {
    return req.query.tenantId || req.body?.tenantId || null;
  }

  return req.auth.profile.tenant_id;
}

// GET /api/whatsapp/instances — List saved instances
router.get('/instances', async (req, res, next) => {
  try {
    const tenantId = resolveTenantId(req);
    let query = supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/whatsapp/instances — Create instance
router.post('/instances', async (req, res, next) => {
  try {
    const { instanceName } = req.body;
    const tenantId = resolveTenantId(req);

    if (!instanceName) {
      return res.status(400).json({ error: true, message: 'instanceName is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ error: true, message: 'tenantId is required for superadmin' });
    }

    const result = await evolutionApi.createInstance(instanceName);

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        api_url: process.env.EVOLUTION_API_URL,
        api_key: process.env.EVOLUTION_API_KEY,
        status: 'disconnected',
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-configure webhook
    if (process.env.WEBHOOK_URL) {
      try {
        await evolutionApi.setWebhook(instanceName, process.env.WEBHOOK_URL);
      } catch (whErr) {
        console.warn('Webhook config failed:', whErr.message);
      }
    }

    res.status(201).json({ instance: data, evolution: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/whatsapp/instances/:name/qrcode — Get QR code (auto-recover)
//
// Fluxo: ao pedir o QR, primeiro garantimos que a instância existe no Evolution
// e que o webhook está apontando para a edge function `webhook-messages`.
// Se a instância sumiu (404) ou o Evolution responde 5xx, recriamos e
// reconfiguramos o webhook automaticamente — assim o usuário NUNCA fica preso
// num loading infinito ao clicar em "Conectar".
router.get('/instances/:name/qrcode', async (req, res, next) => {
  try {
    const instanceName = req.params.name;
    const webhookUrl = process.env.WEBHOOK_URL;

    // 1) Garante que a instância existe / recria se necessário
    const ensured = await evolutionApi.ensureInstanceReady(instanceName, webhookUrl);

    // 2) Se já está conectada, não há QR para retornar
    if (ensured.state === 'open') {
      return res.json({
        connected: true,
        state: 'open',
        instanceName,
        recreated: false,
      });
    }

    // 3) Busca o QR (base64 + pairingCode)
    const qr = await evolutionApi.getQRCode(instanceName);
    res.json({ ...qr, recreated: ensured.recreated });
  } catch (err) {
    next(err);
  }
});

// GET /api/whatsapp/instances/:name/status — Get connection state
router.get('/instances/:name/status', async (req, res, next) => {
  try {
    const data = await evolutionApi.getConnectionState(req.params.name);
    const state = data?.instance?.state;
    const tenantId = resolveTenantId(req);

    // Update status in DB
    let query = supabase
      .from('whatsapp_instances')
      .update({ status: state === 'open' ? 'connected' : 'disconnected', updated_at: new Date().toISOString() })
      .eq('instance_name', req.params.name);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    await query;

    res.json({ state, instanceName: req.params.name });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/whatsapp/instances/:name — Delete instance
router.delete('/instances/:name', async (req, res, next) => {
  try {
    const tenantId = resolveTenantId(req);

    try {
      await evolutionApi.deleteInstance(req.params.name);
    } catch (evoErr) {
      console.warn('Evolution delete failed:', evoErr.message);
    }

    let query = supabase
      .from('whatsapp_instances')
      .delete()
      .eq('instance_name', req.params.name);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { error } = await query;

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/whatsapp/instances/:name/reconnect — Reconnect
router.post('/instances/:name/reconnect', async (req, res, next) => {
  try {
    const data = await evolutionApi.getQRCode(req.params.name);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
