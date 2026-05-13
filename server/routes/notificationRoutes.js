const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const protectRoute = require('../middleware/protectRoute');

router.use(protectRoute);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
