const { db } = require('../database/init');

/**
 * MESSAGE MODEL
 * Handles high-frequency message operations.
 */
const MessageModel = {
  create: (id, senderId, roomId, conversationId, content, type = 'TEXT', mediaUrl = null) => {
    console.log(`[MessageModel] Creating message ${id} for sender ${senderId}`);
    
    db.prepare(`
      INSERT INTO messages (id, sender_id, room_id, conversation_id, content, type, media_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')
    `).run(id, senderId, roomId || null, conversationId || null, content, type, mediaUrl);
    
    // Return the message WITH sender info via JOIN for immediate frontend rendering
    const message = db.prepare(`
      SELECT m.*, 
             u.username as sender_username, 
             u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(id);

    return message;
  },

  /**
   * Paginated retrieval of room history.
   * JOIN with users ensures we have sender metadata for the UI.
   */
  findByRoom: (roomId, limit = 50, offset = 0) => {
    console.log(`[MessageModel] Fetching messages for room ${roomId}`);
    return db.prepare(`
      SELECT m.*, 
             u.username as sender_username, 
             u.avatar as sender_avatar,
             (SELECT GROUP_CONCAT(user_id) FROM read_receipts WHERE message_id = m.id) as read_by
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.room_id = ? 
      ORDER BY m.created_at DESC 
      LIMIT ? OFFSET ?
    `).all(roomId, limit, offset);
  },

  findByConversation: (conversationId, limit = 50, offset = 0) => {
    return db.prepare(`
      SELECT m.*, 
             u.username as sender_username, 
             u.avatar as sender_avatar,
             (SELECT COUNT(*) FROM read_receipts WHERE message_id = m.id) as is_read
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.conversation_id = ? 
      ORDER BY m.created_at DESC 
      LIMIT ? OFFSET ?
    `).all(conversationId, limit, offset);
  },

  findById: (id) => {
    return db.prepare(`
      SELECT m.*, 
             u.username as sender_username, 
             u.avatar as sender_avatar
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.id = ?
    `).get(id);
  },

  updateContent: (id, content) => {
    return db.prepare("UPDATE messages SET content = ?, is_edited = 1, updated_at = datetime('now') WHERE id = ?").run(content, id);
  },

  softDelete: (id) => {
    return db.prepare("UPDATE messages SET is_deleted = 1, content = 'This message was deleted' WHERE id = ?").run(id);
  },

  updateStatus: (id, status) => {
    return db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id);
  },

  markAsRead: (id) => {
    return db.prepare("UPDATE messages SET status = 'read', read_at = datetime('now') WHERE id = ?").run(id);
  },

  addReadReceipt: (messageId, userId) => {
    return db.prepare(`
      INSERT OR IGNORE INTO read_receipts (message_id, user_id)
      VALUES (?, ?)
    `).run(messageId, userId);
  },

  getUnreadCount: (conversationId, userId) => {
    return db.prepare(`
      SELECT COUNT(*) as count FROM messages m
      WHERE conversation_id = ? 
      AND sender_id != ? 
      AND NOT EXISTS (SELECT 1 FROM read_receipts WHERE message_id = m.id AND user_id = ?)
    `).get(conversationId, userId, userId).count;
  }
};

module.exports = MessageModel;
