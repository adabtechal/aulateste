const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/stages — List all stages ordered by position
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('kanban_stages')
      .select('*')
      .order('position');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/stages — Create stage
router.post('/', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: true, message: 'Name is required' });
    }

    const { data: maxPos } = await supabase
      .from('kanban_stages')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (maxPos?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('kanban_stages')
      .insert({ name, color: color || '#6B7280', position })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/stages/:id — Update stage
router.put('/:id', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const { data, error } = await supabase
      .from('kanban_stages')
      .update({ name, color, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/stages/:id — Delete stage (block if has leads)
router.delete('/:id', async (req, res, next) => {
  try {
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('current_stage_id', req.params.id);

    if (count > 0) {
      return res.status(400).json({
        error: true,
        message: `Cannot delete stage with ${count} leads. Move them first.`
      });
    }

    const { error } = await supabase
      .from('kanban_stages')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/stages/reorder — Batch reorder stages
router.patch('/reorder', async (req, res, next) => {
  try {
    const { stages } = req.body;
    if (!Array.isArray(stages)) {
      return res.status(400).json({ error: true, message: 'stages array required' });
    }

    for (const { id, position } of stages) {
      await supabase
        .from('kanban_stages')
        .update({ position })
        .eq('id', id);
    }

    const { data } = await supabase
      .from('kanban_stages')
      .select('*')
      .order('position');

    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
