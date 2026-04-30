const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/tags — List all tags
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/tags — Create tag
router.post('/', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });

    const { data, error } = await supabase
      .from('tags')
      .insert({ name: name.trim().toLowerCase(), color: color || '#5a4a9c' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Tag já existe' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tags/:id — Update tag
router.put('/:id', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const update = {};
    if (name) update.name = name.trim().toLowerCase();
    if (color) update.color = color;

    const { data, error } = await supabase
      .from('tags')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tags/:id — Delete tag
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
