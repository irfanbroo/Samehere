const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all truths for current user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM truths WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a truth
router.post('/', auth, async (req, res) => {
  const { content, debug_date } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await db.query(
      debug_date
        ? 'INSERT INTO truths (user_id, content, created_at) VALUES ($1, $2, $3) RETURNING *'
        : 'INSERT INTO truths (user_id, content) VALUES ($1, $2) RETURNING *',
      debug_date
        ? [req.user.id, content.trim(), `${debug_date}T12:00:00.000Z`]
        : [req.user.id, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update resolution
router.put('/:id', auth, async (req, res) => {
  const { resolution } = req.body;
  try {
    const result = await db.query(
      'UPDATE truths SET resolution = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [resolution, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a truth
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM truths WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
