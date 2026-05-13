const MessageModel = require('../models/messageModel');

/**
 * VERIFY MESSAGE OWNER MIDDLEWARE
 */
const verifyMessageOwner = (req, res, next) => {
  const messageId = req.params.id;
  const userId = req.user.id;

  const message = MessageModel.findById(messageId);
  if (!message) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  if (message.sender_id !== userId) {
    return res.status(403).json({ success: false, error: 'Unauthorized. You can only modify your own messages.' });
  }

  next();
};

module.exports = verifyMessageOwner;
