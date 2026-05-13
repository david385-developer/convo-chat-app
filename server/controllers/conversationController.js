const { v4: uuidv4 } = require('uuid');
const ConversationModel = require('../models/conversationModel');
const MessageModel = require('../models/messageModel');
const UserModel = require('../models/userModel');

/**
 * CONVERSATION CONTROLLER
 * Manages the lifecycle of private 1-to-1 DMs.
 */
const conversationController = {
  /**
   * Returns an existing DM or creates a new one.
   */
  getOrCreateConversation: async (req, res, next) => {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ success: false, error: 'Target user ID is required' });
    }

    if (otherUserId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot message yourself' });
    }

    try {
      // 1. Verify target user exists
      const otherUser = UserModel.findById(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // 2. Check for existing conversation
      const existing = ConversationModel.findByParticipants(req.user.id, otherUserId);
      
      if (existing) {
        const conversation = {
          ...existing,
          other_user_id: otherUser.id,
          other_username: otherUser.username,
          other_avatar: otherUser.avatar,
          other_status: otherUser.status
        };
        return res.status(200).json({ success: true, conversation });
      }

      // 3. Create new conversation
      const id = uuidv4();
      ConversationModel.create(id, req.user.id, otherUserId);
      
      const conversation = {
        id,
        other_user_id: otherUser.id,
        other_username: otherUser.username,
        other_avatar: otherUser.avatar,
        other_status: otherUser.status
      };

      res.status(201).json({ success: true, conversation });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lists all DMs for the current user with latest activity.
   */
  getUserConversations: async (req, res, next) => {
    try {
      const conversations = ConversationModel.getUserConversations(req.user.id);
      res.status(200).json({ success: true, conversations });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Fetches paginated history for a specific DM.
   */
  getConversationMessages: async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
      const messages = MessageModel.findByConversation(req.params.id, limit, offset);
      const hasMore = messages.length === limit;

      res.status(200).json({ 
        success: true, 
        messages: messages.reverse(), 
        hasMore 
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = conversationController;
