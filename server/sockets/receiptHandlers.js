const messageModel = require('../models/messageModel');
const presenceHandlers = require('./presenceHandlers');

/**
 * RECEIPT HANDLERS
 * Manages the transition of message states: 
 * 'sent' (Saved) -> 'delivered' (Received by client) -> 'read' (Seen by user)
 */
module.exports.register = (socket, io) => {

  /**
   * EVENT: message_read
   * Emitted by the recipient when they view a specific message.
   */
  socket.on('message_read', (data) => {
    const { messageId, roomId, conversationId } = data;

    // 1. Persist to DB
    messageModel.addReadReceipt(messageId, socket.user.id);

    // 2. Notify Others
    const payload = { messageId, userId: socket.user.id, readAt: new Date().toISOString() };
    if (roomId) {
      io.to(`room:${roomId}`).emit('message_read_update', payload);
    } else if (conversationId) {
      io.to(`conv:${conversationId}`).emit('message_read_update', payload);
    }
  });

  /**
   * EVENT: messages_read (Batch)
   */
  socket.on('messages_read', (data) => {
    const { messageIds, roomId, conversationId } = data;
    if (!messageIds || !messageIds.length) return;

    // 1. Batch Update DB
    messageIds.forEach(id => messageModel.addReadReceipt(id, socket.user.id));

    // 2. Notify Others
    const payload = { messageIds, userId: socket.user.id, readAt: new Date().toISOString() };
    if (roomId) {
      io.to(`room:${roomId}`).emit('messages_read_update', payload);
    } else if (conversationId) {
      io.to(`conv:${conversationId}`).emit('messages_read_update', payload);
    }
    
    console.log(`[Receipts] ${socket.user.username} read ${messageIds.length} messages in ${roomId || conversationId}`);
  });
};
