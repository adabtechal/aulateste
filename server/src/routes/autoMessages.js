const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/auto-messages/stage/:stageId — List auto messages for stage
router.get('/stage/:stageId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('auto_messages')
      .select('*')
      .eq('stage_id', req.params.stageId)
      .order('position');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auto-messages — Create auto message
router.post('/', async (req, res, next) => {
  try {
    const { stage_id, message_template, message_type, media_url, delay_minutes, is_active, position } = req.body;
    if (!stage_id || !message_template || delay_minutes == null) {
      return res.status(400).json({ error: true, message: 'stage_id, message_template, and delay_minutes are required' });
    }

    const { data, error } = await supabase
      .from('auto_messages')
      .insert({
        stage_id,
        message_template,
        message_type: message_type || 'text',
        media_url,
        delay_minutes,
        is_active: is_active !== false,
        position: position || 0
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auto-messages/:id — Update auto message
router.put('/:id', async (req, res, next) => {
  try {
    const { message_template, message_type, media_url, delay_minutes, is_active, position } = req.body;
    const { data, error } = await supabase
      .from('auto_messages')
      .update({ message_template, message_type, media_url, delay_minutes, is_active, position })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auto-messages/:id — Delete auto message
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('auto_messages')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auto-messages/:id/toggle — Toggle active state
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from('auto_messages')
      .select('is_active')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('auto_messages')
      .update({ is_active: !current.is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
