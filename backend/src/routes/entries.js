const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Create entry
router.post('/', auth, async (req, res) => {
  const { content, mood, tags } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  try {
    const result = await db.query(
      'INSERT INTO entries (user_id, content, mood, tags) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, content, mood || null, tags || []]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Activity heatmap — last 84 days
router.get('/activity', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM entries WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '84 days'
       GROUP BY DATE(created_at)`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// My moods this week
router.get('/my-moods', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT mood, COUNT(*) as count FROM entries
       WHERE user_id = $1 AND mood IS NOT NULL
       AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY mood`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Explore — all public entries for new users
router.get('/explore', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.username, u.profile_pic,
        (SELECT COUNT(*) FROM likes WHERE entry_id = e.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE entry_id = e.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE entry_id = e.id AND user_id = $1) AS liked
       FROM entries e
       JOIN users u ON u.id = e.user_id
       WHERE e.user_id != $1
       ORDER BY e.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get feed (people you follow + your own)
router.get('/feed', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.username, u.profile_pic,
        (SELECT COUNT(*) FROM likes WHERE entry_id = e.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE entry_id = e.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE entry_id = e.id AND user_id = $1) AS liked
       FROM entries e
       JOIN users u ON u.id = e.user_id
       WHERE e.user_id = $1
          OR e.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
       ORDER BY e.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single entry
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await db.query(
      `SELECT e.*, u.username, u.profile_pic,
        (SELECT COUNT(*) FROM likes WHERE entry_id = e.id) AS likes_count,
        EXISTS(SELECT 1 FROM likes WHERE entry_id = e.id AND user_id = $2) AS liked
       FROM entries e JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [req.params.id, req.user.id]
    );
    if (!entry.rows[0]) return res.status(404).json({ error: 'Not found' });

    const comments = await db.query(
      `SELECT c.*, u.username, u.profile_pic FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.entry_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ ...entry.rows[0], comments: comments.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit entry
router.put('/:id', auth, async (req, res) => {
  const { content, tags } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await db.query(
      'UPDATE entries SET content = $1, tags = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [content, tags || [], req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Like / unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT id FROM likes WHERE user_id = $1 AND entry_id = $2',
      [req.user.id, req.params.id]
    );
    if (existing.rows[0]) {
      await db.query('DELETE FROM likes WHERE user_id = $1 AND entry_id = $2', [req.user.id, req.params.id]);
      return res.json({ liked: false });
    }
    await db.query('INSERT INTO likes (user_id, entry_id) VALUES ($1, $2)', [req.user.id, req.params.id]);
    res.json({ liked: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Comment
router.post('/:id/comment', auth, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  try {
    const result = await db.query(
      `INSERT INTO comments (user_id, entry_id, content) VALUES ($1, $2, $3)
       RETURNING *, (SELECT username FROM users WHERE id = $1) AS username, (SELECT profile_pic FROM users WHERE id = $1) AS profile_pic`,
      [req.user.id, req.params.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.commentId, req.user.id]
    );
    if (!result.rows[0]) return res.status(403).json({ error: 'Not allowed' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
