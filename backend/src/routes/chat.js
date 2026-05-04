const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get conversations (list of people you've chatted with + last message + unread count)
router.get('/conversations', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (other_id)
        other_id, u.username, u.profile_pic,
        m.content AS last_message,
        m.created_at AS last_message_at,
        m.sender_id AS last_sender_id,
        (SELECT COUNT(*) FROM messages WHERE sender_id = other_id AND receiver_id = $1 AND read = false) AS unread
       FROM (
         SELECT
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id,
           id
         FROM messages
         WHERE sender_id = $1 OR receiver_id = $1
       ) sub
       JOIN messages m ON m.id = sub.id
       JOIN users u ON u.id = sub.other_id
       ORDER BY other_id, m.created_at DESC`,
      // Note: profile_pic added below
      [req.user.id]
    );
    // Sort by last message time
    result.rows.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    // Mark messages as read
    await db.query(
      'UPDATE messages SET read = true WHERE sender_id = $1 AND receiver_id = $2 AND read = false',
      [req.params.userId, req.user.id]
    );

    const result = await db.query(
      `SELECT m.*, u.username AS sender_username
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.user.id, req.params.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim()) return res.status(400).json({ error: 'Missing fields' });

  try {
    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, receiver_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total unread count
router.get('/unread', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
