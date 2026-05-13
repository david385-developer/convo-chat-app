const { db } = require('../database/init');

/**
 * NOTIFICATION MODEL
 * Manages user-specific alerts for mentions and system events.
 */
const NotificationModel = {
  create: (id, userId, type, content, sourceId = null, sourceType = null) => {
    return db.prepare(`
      INSERT INTO notifications (id, user_id, type, content, source_id, source_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, type, content, sourceId, sourceType);
  },

  findByUser: (userId, limit = 20, offset = 0) => {
    return db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
  },

  markAsRead: (id) => {
    return db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  },

  markAllAsRead: (userId) => {
    return db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);
  },

  getUnreadCount: (userId) => {
    return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId).count;
  }
};

module.exports = NotificationModel;
