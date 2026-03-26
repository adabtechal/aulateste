const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendTextMessage, sendMediaMessage } = require('../services/messageService');

// GET /api/messages — List all messages with filters
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, lead, type, direction, from, to } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('message_log')
      .select('*, leads(name, phone)', { count: 'exact' });

    if (lead) query = query.eq('lead_id', lead);
    if (type) query = query.eq('message_type', type);
    if (direction) query = query.eq('direction', direction);
    if (from) query = query.gte('sent_at', from);
    if (to) query = query.lte('sent_at', to);

    const { data, error, count } = await query
      .order('sent_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/export — Export CSV
router.get('/export', async (req, res, next) => {
  try {
    const { lead, type, direction, from, to } = req.query;

    let query = supabase
      .from('message_log')
      .select('*, leads(name, phone)');

    if (lead) query = query.eq('lead_id', lead);
    if (type) query = query.eq('message_type', type);
    if (direction) query = query.eq('direction', direction);
    if (from) query = query.gte('sent_at', from);
    if (to) query = query.lte('sent_at', to);

    const { data, error } = await query.order('sent_at', { ascending: false });
    if (error) throw error;

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
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/lead/:leadId — Messages for specific lead
router.get('/lead/:leadId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('message_log')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/send-text
router.post('/send-text', async (req, res, next) => {
  try {
    const { leadId, text } = req.body;
    if (!leadId || !text) {
      return res.status(400).json({ error: true, message: 'leadId and text are required' });
    }
    const result = await sendTextMessage(leadId, text);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/send-media
router.post('/send-media', async (req, res, next) => {
  try {
    const { leadId, mediaUrl, caption, mimetype } = req.body;
    if (!leadId || !mediaUrl) {
      return res.status(400).json({ error: true, message: 'leadId and mediaUrl are required' });
    }
    const result = await sendMediaMessage(leadId, mediaUrl, caption || '', mimetype);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
