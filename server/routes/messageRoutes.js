const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/protectRoute');
const verifyMessageOwner = require('../middleware/verifyMessageOwner');
const messageController = require('../controllers/messageController');

router.use(protectRoute);

router.put('/:id', verifyMessageOwner, messageController.editMessage);
router.delete('/:id', verifyMessageOwner, messageController.deleteMessage);

module.exports = router;
