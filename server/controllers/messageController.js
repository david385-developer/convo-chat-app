const MessageModel = require('../models/messageModel');

/**
 * MESSAGE CONTROLLER
 * Handles REST operations for message manipulation.
 * Note: Real-time edits are usually handled via Sockets, but REST provides fallback/history.
 */
const messageController = {
  /**
   * Updates message content.
   * Middleware: verifyMessageOwner ensures req.message is the target and owned by current user.
   */
  editMessage: async (req, res, next) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Content cannot be empty' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message too long' });
    }

    try {
      MessageModel.updateContent(req.params.id, content.trim());
      const updated = MessageModel.findById(req.params.id);
      
      res.status(200).json({ success: true, message: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Performs a soft-delete on a message.
   */
  deleteMessage: async (req, res, next) => {
    try {
      MessageModel.softDelete(req.params.id);
      res.status(200).json({ success: true, messageId: req.params.id });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = messageController;
