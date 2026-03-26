const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/leads — List with pagination, search, filters
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, stage, tags } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*, kanban_stages(name, color)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (stage) {
      query = query.eq('current_stage_id', stage);
    }
    if (tags) {
      const tagArray = tags.split(',');
      query = query.overlaps('tags', tagArray);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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

// GET /api/leads/:id — Lead detail with stage history
router.get('/:id', async (req, res, next) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*, kanban_stages(name, color)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!lead) return res.status(404).json({ error: true, message: 'Lead not found' });

    const { data: history } = await supabase
      .from('lead_stage_history')
      .select('*, from_stage:kanban_stages!from_stage_id(name, color), to_stage:kanban_stages!to_stage_id(name, color)')
      .eq('lead_id', req.params.id)
      .order('moved_at', { ascending: false });

    res.json({ ...lead, stage_history: history || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/leads — Create lead (auto-assign first stage)
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, company, tags, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: true, message: 'Name and phone are required' });
    }

    // Get first active stage
    const { data: firstStage } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('is_active', true)
      .order('position')
      .limit(1)
      .single();

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name, phone, email, company,
        tags: tags || [],
        notes,
        current_stage_id: firstStage?.id
      })
      .select('*, kanban_stages(name, color)')
      .single();

    if (error) throw error;

    // Create initial stage history
    if (firstStage?.id) {
      await supabase.from('lead_stage_history').insert({
        lead_id: lead.id,
        from_stage_id: null,
        to_stage_id: firstStage.id
      });
    }

    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// PUT /api/leads/:id — Update lead
router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email, company, tags, notes } = req.body;
    const { data, error } = await supabase
      .from('leads')
      .update({ name, phone, email, company, tags, notes, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, kanban_stages(name, color)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leads/:id — Delete lead
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leads/:id/stage — Move lead to stage
router.patch('/:id/stage', async (req, res, next) => {
  try {
    const { stageId } = req.body;
    if (!stageId) {
      return res.status(400).json({ error: true, message: 'stageId is required' });
    }

    // Get current stage
    const { data: current } = await supabase
      .from('leads')
      .select('current_stage_id')
      .eq('id', req.params.id)
      .single();

    if (current?.current_stage_id === stageId) {
      return res.json({ message: 'Lead already in this stage' });
    }

    // Update lead stage
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ current_stage_id: stageId, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, kanban_stages(name, color)')
      .single();

    if (error) throw error;

    // Record history
    const { data: historyEntry } = await supabase
      .from('lead_stage_history')
      .insert({
        lead_id: req.params.id,
        from_stage_id: current?.current_stage_id,
        to_stage_id: stageId
      })
      .select()
      .single();

    // Cancel pending scheduled messages for old stage
    if (current?.current_stage_id) {
      await supabase
        .from('scheduled_messages')
        .update({ status: 'cancelled' })
        .match({ lead_id: req.params.id, stage_id: current.current_stage_id, status: 'pending' });
    }

    // Schedule auto messages for new stage
    const { data: autoMessages } = await supabase
      .from('auto_messages')
      .select('*')
      .eq('stage_id', stageId)
      .eq('is_active', true);

    if (autoMessages?.length) {
      const scheduled = autoMessages.map(am => ({
        lead_id: req.params.id,
        auto_message_id: am.id,
        stage_id: stageId,
        scheduled_at: new Date(Date.now() + am.delay_minutes * 60000).toISOString(),
        status: 'pending'
      }));
      await supabase.from('scheduled_messages').insert(scheduled);
    }

    res.json({ lead, history_entry: historyEntry });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leads/:id/pause-followup — Toggle auto followup
router.patch('/:id/pause-followup', async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from('leads')
      .select('auto_followup_paused')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('leads')
      .update({ auto_followup_paused: !current.auto_followup_paused })
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
