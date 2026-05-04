const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get unseen notification counts
router.get('/count', auth, async (req, res) => {
  try {
    const user = await db.query('SELECT last_seen_likes_at, last_seen_comments_at FROM users WHERE id = $1', [req.user.id]);
    const { last_seen_likes_at, last_seen_comments_at } = user.rows[0];

    const likes = await db.query(
      `SELECT COUNT(*) FROM likes l
       JOIN entries e ON e.id = l.entry_id
       WHERE e.user_id = $1 AND l.user_id != $1 AND l.created_at > $2`,
      [req.user.id, last_seen_likes_at]
    );

    const comments = await db.query(
      `SELECT COUNT(*) FROM comments c
       JOIN entries e ON e.id = c.entry_id
       WHERE e.user_id = $1 AND c.user_id != $1 AND c.created_at > $2`,
      [req.user.id, last_seen_comments_at]
    );

    res.json({
      likes: parseInt(likes.rows[0].count),
      comments: parseInt(comments.rows[0].count),
      total: parseInt(likes.rows[0].count) + parseInt(comments.rows[0].count),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark likes as seen
router.put('/seen/likes', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET last_seen_likes_at = NOW() WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark comments as seen
router.put('/seen/comments', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET last_seen_comments_at = NOW() WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
