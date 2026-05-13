const { v4: uuidv4 } = require('uuid');
const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');
const conversationModel = require('../models/conversationModel');
const notificationModel = require('../models/notificationModel');
const presenceHandlers = require('./presenceHandlers');

module.exports.register = (socket, io) => {

  /**
   * EVENT: send_message
   */
  socket.on('send_message', async (data) => {
    const { content, type, roomId, conversationId, mediaUrl } = data;

    console.log('[Socket] send_message received:', {
      sender: socket.user.username,
      roomId,
      conversationId,
      content: content?.substring(0, 50)
    });

    if (!content || !content.trim()) {
      return socket.emit('error', { message: 'Message content cannot be empty' });
    }
    if (!roomId && !conversationId) {
      return socket.emit('error', { message: 'Must specify room or conversation context' });
    }

    let finalType = type;
    if (!finalType) {
      if (mediaUrl) finalType = 'IMAGE';
      else if (/[*_`#\[]/.test(content)) finalType = 'MARKDOWN';
      else finalType = 'TEXT';
    }

    try {
      const messageId = uuidv4();

      // 1. SAVE TO DATABASE
      const message = messageModel.create(
        messageId,
        socket.user.id,
        roomId || null,
        conversationId || null,
        content.trim(),
        finalType,
        mediaUrl || null
      );

      // 2. BROADCAST
      if (roomId) {
        const roomChannel = `room:${roomId}`;
        console.log(`[Socket] Broadcasting to room channel: ${roomChannel}`);
        io.to(roomChannel).emit('receive_message', message);
      } else if (conversationId) {
        const convChannel = `conv:${conversationId}`;
        console.log(`[Socket] Broadcasting to DM channel: ${convChannel}`);
        io.to(convChannel).emit('receive_message', message);
      }

      // 3. STATUS UPDATE
      messageModel.updateStatus(message.id, 'delivered');
      socket.emit('message_delivered', { messageId: message.id });

      // 4. MENTIONS
      const mentionRegex = /@(\w+)/g;
      let match;
      const mentionedUsernames = new Set();
      while ((match = mentionRegex.exec(content)) !== null) {
        mentionedUsernames.add(match[1]);
      }

      mentionedUsernames.forEach(username => {
        const mentionedUser = userModel.findByUsername(username);
        if (mentionedUser && mentionedUser.id !== socket.user.id) {
          const notifId = uuidv4();
          notificationModel.create(notifId, mentionedUser.id, 'mention', `${socket.user.username} mentioned you`, message.id, 'message');

          const mentionedSocketId = presenceHandlers.getSocketId(mentionedUser.id);
          if (mentionedSocketId) {
            io.to(mentionedSocketId).emit('new_notification', {
              id: notifId,
              type: 'mention',
              content: `${socket.user.username} mentioned you`,
              source_id: message.id,
              source_type: 'message',
              room_id: roomId,
              conversation_id: conversationId,
              is_read: 0,
              created_at: new Date().toISOString()
            });
          }
        }
      });

    } catch (err) {
      console.error('[Socket Message Error]', err);
      socket.emit('error', { message: 'Internal server error processing message' });
    }
  });

  socket.on('edit_message', (data) => {
    const { messageId, content } = data;
    const message = messageModel.findById(messageId);

    if (!message || message.sender_id !== socket.user.id) return;

    messageModel.updateContent(messageId, content.trim());
    const updated = messageModel.findById(messageId);

    if (updated.room_id) {
      io.to(`room:${updated.room_id}`).emit('message_updated', updated);
    } else if (updated.conversation_id) {
      io.to(`conv:${updated.conversation_id}`).emit('message_updated', updated);
    }
  });

  socket.on('delete_message', (data) => {
    const { messageId } = data;
    const message = messageModel.findById(messageId);

    if (!message || message.sender_id !== socket.user.id) return;

    messageModel.softDelete(messageId);
    
    const payload = { messageId, roomId: message.room_id, conversationId: message.conversation_id };
    if (message.room_id) {
      io.to(`room:${message.room_id}`).emit('message_deleted', payload);
    } else if (message.conversation_id) {
      io.to(`conv:${message.conversation_id}`).emit('message_deleted', payload);
    }
  });
};
