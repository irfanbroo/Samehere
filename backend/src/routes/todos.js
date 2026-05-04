const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all todos for current user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY completed ASC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create todo
router.post('/', auth, async (req, res) => {
  const { content, due_date, priority, time_slot } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await db.query(
      'INSERT INTO todos (user_id, content, due_date, priority, time_slot) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, content.trim(), due_date || null, priority || 'medium', time_slot || 'morning']
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle completed / edit content / update due_date / priority
router.put('/:id', auth, async (req, res) => {
  const { completed, content, due_date, priority, time_slot } = req.body;
  try {
    const todo = await db.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!todo.rows[0]) return res.status(404).json({ error: 'Not found' });

    const result = await db.query(
      `UPDATE todos SET
        completed = COALESCE($1, completed),
        content = COALESCE($2, content),
        due_date = CASE WHEN $3::text IS NOT NULL THEN $3::date ELSE due_date END,
        priority = COALESCE($5, priority),
        time_slot = COALESCE($6, time_slot)
       WHERE id = $4 RETURNING *`,
      [completed !== undefined ? completed : null, content || null, due_date !== undefined ? due_date : null, req.params.id, priority || null, time_slot || null]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete todo
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
