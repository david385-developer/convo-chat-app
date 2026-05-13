const { db } = require('../database/init');

/**
 * CONVERSATION MODEL
 * Manages 1-to-1 private communication tunnels.
 */
const ConversationModel = {
  /**
   * Creates a conversation record and its participants.
   * Uses a transaction to ensure atomic integrity.
   */
  create: (id, userId1, userId2) => {
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO private_conversations (id) VALUES (?)').run(id);
      db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(id, userId1);
      db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(id, userId2);
    });
    transaction();
    return ConversationModel.findById(id);
  },

  /**
   * Checks if a DM already exists between two users.
   * Self-join pattern: finds a conversation ID shared by both users.
   */
  findByParticipants: (userId1, userId2) => {
    return db.prepare(`
      SELECT cp1.conversation_id as id 
      FROM conversation_participants cp1
      JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = ? AND cp2.user_id = ?
    `).get(userId1, userId2);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM private_conversations WHERE id = ?').get(id);
  },

  /**
   * Retrieves all DMs for a user with preview data.
   * 
   * Strategy:
   * 1. Get all conversations the user is in.
   * 2. JOIN with other participant's user info.
   * 3. LEFT JOIN with the latest message for preview.
   * 4. COUNT unread messages from the other user.
   */
  getUserConversations: (userId) => {
    return db.prepare(`
      SELECT 
        pc.id, 
        u.id as other_user_id,
        u.username as other_username, 
        u.avatar as other_avatar, 
        u.status as other_status,
        (
          SELECT content FROM messages 
          WHERE conversation_id = pc.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_content,
        (
          SELECT created_at FROM messages 
          WHERE conversation_id = pc.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_at,
        (
          SELECT COUNT(*) FROM messages m
          WHERE m.conversation_id = pc.id 
          AND m.sender_id != ? 
          AND NOT EXISTS (SELECT 1 FROM read_receipts WHERE message_id = m.id AND user_id = ?)
        ) as unread_count
      FROM private_conversations pc
      JOIN conversation_participants cp_me ON pc.id = cp_me.conversation_id
      JOIN conversation_participants cp_other ON pc.id = cp_other.conversation_id
      JOIN users u ON cp_other.user_id = u.id
      WHERE cp_me.user_id = ? AND cp_other.user_id != ?
      ORDER BY last_message_at DESC, pc.created_at DESC
    `).all(userId, userId, userId, userId);
  },

  isParticipant: (conversationId, userId) => {
    const row = db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?').get(conversationId, userId);
    return !!row;
  },

  getParticipants: (conversationId) => {
    return db.prepare(`
      SELECT user_id FROM conversation_participants WHERE conversation_id = ?
    `).all(conversationId);
  }
};

module.exports = ConversationModel;
