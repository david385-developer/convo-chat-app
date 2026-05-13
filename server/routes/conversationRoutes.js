const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/protectRoute');
const verifyConversationMember = require('../middleware/verifyConversationMember');
const conversationController = require('../controllers/conversationController');

router.use(protectRoute);

router.post('/', conversationController.getOrCreateConversation);
router.get('/', conversationController.getUserConversations);
router.get('/:id/messages', verifyConversationMember, conversationController.getConversationMessages);

module.exports = router;
