const { v4: uuidv4 } = require('uuid');
const notificationModel = require('../models/notificationModel');
const presenceHandlers = require('./presenceHandlers');

/**
 * NOTIFICATION HANDLERS
 * Manages the delivery of alerts and synchronous state updates (unread counts).
 */

/**
 * HELPER: sendNotification
 * Can be imported by other handlers (e.g. messageHandlers for @mentions)
 */
const sendNotification = (io, userId, notification) => {
  const id = uuidv4();
  
  // 1. Save to DB for persistent access
  notificationModel.create(
    id, 
    userId, 
    notification.type, 
    notification.content, 
    notification.sourceId, 
    notification.sourceType
  );

  // 2. Calculate new unread count
  const count = notificationModel.getUnreadCount(userId);

  // 3. Real-time Push
  const socketId = presenceHandlers.getSocketId(userId);
  if (socketId) {
    io.to(socketId).emit('new_notification', {
      id,
      ...notification,
      is_read: 0,
      created_at: new Date().toISOString()
    });
    io.to(socketId).emit('unread_count_update', { count });
  }
};

module.exports.sendNotification = sendNotification;

module.exports.register = (socket, io) => {

  /**
   * EVENT: mark_notification_read
   */
  socket.on('mark_notification_read', (data) => {
    const { notificationId } = data;
    notificationModel.markAsRead(notificationId);
    
    // Sync unread count
    const count = notificationModel.getUnreadCount(socket.user.id);
    socket.emit('unread_count_update', { count });
  });

  /**
   * EVENT: mark_all_notifications_read
   */
  socket.on('mark_all_notifications_read', () => {
    notificationModel.markAllAsRead(socket.user.id);
    socket.emit('unread_count_update', { count: 0 });
  });
};
