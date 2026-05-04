const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Search users by username or ID — must be before /:id
router.get('/search', auth, async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  try {
    const clean = q.trim().replace(/^#/, '');
    const result = await db.query(
      `SELECT id, username, bio, profile_pic, tags, user_code
       FROM users
       WHERE (username ILIKE $1 OR user_code ILIKE $2)
       AND id != $3
       LIMIT 20`,
      [`${clean}%`, `${clean}%`, req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Discover similar users (shared tags) — must be before /:id
router.get('/discover/similar', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.bio, u.tags, u.profile_pic,
        array_length(array(SELECT unnest(u.tags) INTERSECT SELECT unnest(me.tags)), 1) AS shared_tags
       FROM users u
       JOIN users me ON me.id = $1
       WHERE u.id != $1
         AND NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id)
         AND u.tags && me.tags
       ORDER BY shared_tags DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload profile pic — must be before /:id
router.put('/me/pic', auth, async (req, res) => {
  const { profile_pic } = req.body;
  if (!profile_pic) return res.status(400).json({ error: 'No image' });
  try {
    const result = await db.query(
      'UPDATE users SET profile_pic = $1 WHERE id = $2 RETURNING id, username, profile_pic',
      [profile_pic, req.user.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload banner pic
router.put('/me/banner', auth, async (req, res) => {
  const { banner_pic } = req.body;
  if (!banner_pic) return res.status(400).json({ error: 'No image' });
  try {
    const result = await db.query(
      'UPDATE users SET banner_pic = $1 WHERE id = $2 RETURNING id, username, banner_pic',
      [banner_pic, req.user.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update own profile — must be before /:id
router.put('/me', auth, async (req, res) => {
  const { username, bio, tags } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET username = COALESCE($1, username), bio = $2, tags = $3 WHERE id = $4 RETURNING id, username, bio, tags',
      [username || null, bio, tags || [], req.user.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await db.query(
      `SELECT id, username, bio, tags, profile_pic, banner_pic, user_code, created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following,
        (SELECT COUNT(*) FROM entries WHERE user_id = u.id) AS entries_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) AS is_following
       FROM users u WHERE u.id = $1`,
      [req.params.id, req.user.id]
    );
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });

    const entries = await db.query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM likes WHERE entry_id = e.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE entry_id = e.id) AS comments_count
       FROM entries e WHERE e.user_id = $1 ORDER BY e.created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ ...user.rows[0], entries: entries.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user comments
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const result = await db.query(
      `(SELECT c.id, c.content, c.created_at,
        e.id AS entry_id, e.content AS entry_content,
        cu.username AS commenter, cu.profile_pic AS commenter_pic,
        eu.username AS entry_author, eu.profile_pic AS entry_author_pic,
        'received' AS type
       FROM comments c
       JOIN entries e ON e.id = c.entry_id
       JOIN users eu ON eu.id = e.user_id
       JOIN users cu ON cu.id = c.user_id
       WHERE e.user_id = $1 AND c.user_id != $1)
      UNION ALL
      (SELECT c.id, c.content, c.created_at,
        e.id AS entry_id, e.content AS entry_content,
        cu.username AS commenter, cu.profile_pic AS commenter_pic,
        eu.username AS entry_author, eu.profile_pic AS entry_author_pic,
        'made' AS type
       FROM comments c
       JOIN entries e ON e.id = c.entry_id
       JOIN users eu ON eu.id = e.user_id
       JOIN users cu ON cu.id = c.user_id
       WHERE c.user_id = $1)
      ORDER BY created_at DESC
      LIMIT 50`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user liked entries
router.get('/:id/likes', auth, async (req, res) => {
  try {
    const result = await db.query(
      `(SELECT l.id, l.created_at,
        e.id AS entry_id, e.content AS entry_content,
        lu.username AS liker, lu.profile_pic AS liker_pic,
        eu.username AS entry_author, eu.profile_pic AS entry_author_pic,
        'received' AS type
       FROM likes l
       JOIN entries e ON e.id = l.entry_id
       JOIN users eu ON eu.id = e.user_id
       JOIN users lu ON lu.id = l.user_id
       WHERE e.user_id = $1 AND l.user_id != $1)
      UNION ALL
      (SELECT l.id, l.created_at,
        e.id AS entry_id, e.content AS entry_content,
        lu.username AS liker, lu.profile_pic AS liker_pic,
        eu.username AS entry_author, eu.profile_pic AS entry_author_pic,
        'made' AS type
       FROM likes l
       JOIN entries e ON e.id = l.entry_id
       JOIN users eu ON eu.id = e.user_id
       JOIN users lu ON lu.id = l.user_id
       WHERE l.user_id = $1 AND e.user_id != $1)
      ORDER BY created_at DESC
      LIMIT 50`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get followers list
router.get('/:id/followers', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_pic, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) AS is_following
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.id, req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following list
router.get('/:id/following', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_pic, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) AS is_following
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.id, req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow / unfollow
router.post('/:id/follow', auth, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: "Can't follow yourself" });

  try {
    const existing = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, req.params.id]
    );
    if (existing.rows[0]) {
      await db.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, req.params.id]);
      return res.json({ following: false });
    }
    await db.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [req.user.id, req.params.id]);
    res.json({ following: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
