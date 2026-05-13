const NotificationModel = require('../models/notificationModel');

/**
 * NOTIFICATION CONTROLLER
 */
const notificationController = {
  getNotifications: (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      
      const notifications = NotificationModel.findByUser(req.user.id, limit, offset);
      res.json({ success: true, notifications });
    } catch (err) {
      next(err);
    }
  },

  markAsRead: (req, res, next) => {
    try {
      NotificationModel.markAsRead(req.params.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  markAllAsRead: (req, res, next) => {
    try {
      NotificationModel.markAllAsRead(req.user.id);
      const unreadCount = NotificationModel.getUnreadCount(req.user.id);
      res.json({ success: true, unreadCount });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationController;
