const ConversationModel = require('../models/conversationModel');

/**
 * VERIFY CONVERSATION MEMBER MIDDLEWARE
 */
const verifyConversationMember = (req, res, next) => {
  const conversationId = req.params.convId || req.params.id;
  const userId = req.user.id;

  if (!ConversationModel.isParticipant(conversationId, userId)) {
    return res.status(403).json({ success: false, error: 'Access denied. You are not a participant in this conversation.' });
  }

  next();
};

module.exports = verifyConversationMember;
