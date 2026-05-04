const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all diary entries for current user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM diary WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single diary entry
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM diary WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a diary entry
router.post('/', auth, async (req, res) => {
  const { title, mood, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await db.query(
      'INSERT INTO diary (user_id, title, mood, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title?.trim() || null, mood || null, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a diary entry
router.put('/:id', auth, async (req, res) => {
  const { title, mood, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await db.query(
      'UPDATE diary SET title = $1, mood = $2, content = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [title?.trim() || null, mood || null, content.trim(), req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a diary entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM diary WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
