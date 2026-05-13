const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/protectRoute');
const verifyRoomMember = require('../middleware/verifyRoomMember');
const { validate, roomRules } = require('../middleware/validateInput');
const roomController = require('../controllers/roomController');

/**
 * ROOM ROUTES
 * All operations require an authenticated user.
 */
router.use(protectRoute);

// 1. Collection operations
router.get('/', roomController.getRooms);
router.post('/', roomRules, validate, roomController.createRoom);

// 2. Specific contextual data (Put these BEFORE generic /:id to avoid collisions)
router.get('/:id/messages', verifyRoomMember, roomController.getRoomMessages);
router.get('/:id/members', verifyRoomMember, roomController.getRoomMembers);

// 3. Instance operations
router.post('/:id/join', roomController.joinRoom);
router.post('/:id/leave', roomController.leaveRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

// 4. Generic Instance (LAST)
router.get('/:id', roomController.getRoom);

module.exports = router;
