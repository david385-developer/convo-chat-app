const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

/**
 * DIAGNOSTIC ROUTES
 * Used to verify database state during real-time debugging.
 */

// 1. Check all messages in a room
router.get('/debug/room-messages/:roomId', (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.id, m.content, m.room_id, m.conversation_id,
             m.sender_id, u.username as sender_name, m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at DESC
    `).all(req.params.roomId);

    res.json({ count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Check room membership
router.get('/debug/room-members/:roomId', (req, res) => {
  try {
    const members = db.prepare(`
      SELECT rm.*, u.username
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
    `).all(req.params.roomId);

    res.json({ count: members.length, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Check all rooms
router.get('/debug/rooms', (req, res) => {
  try {
    const rooms = db.prepare('SELECT * FROM rooms').all();
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Check all users and their status
router.get('/debug/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, status, last_seen FROM users
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
