const presenceHandlers = require('./presenceHandlers');
const conversationModel = require('../models/conversationModel');

/**
 * TYPING HANDLERS
 * Manages the ephemeral "is typing..." state across the system.
 * 
 * Why backend-managed?
 * 1. Relay: One client emits 'start', others receive 'typing'.
 * 2. Cleanup: If a user's browser crashes or they disconnect abruptly, 
 *    the backend ensures the typing indicator is eventually removed via timeouts.
 */

const typingUsers = new Map();
// Key: "contextId:userId" (e.g., "room:abc:user123" or "conv:xyz:user123")
// Value: { userId, username, contextId, timeout }

module.exports.register = (socket, io) => {

  /**
   * EVENT: typing_start
   * Broadcasts that the current user is active in a specific input.
   */
  socket.on('typing_start', (data) => {
    const { roomId, conversationId } = data;
    const contextId = roomId ? `room:${roomId}` : `conv:${conversationId}`;
    const key = `${contextId}:${socket.user.id}`;

    // 1. CLEAR EXISTING TIMEOUT
    // If the user was already typing, we reset the auto-cleanup timer
    const existing = typingUsers.get(key);
    if (existing?.timeout) clearTimeout(existing.timeout);

    // 2. SET AUTO-CLEANUP
    // If we don't hear from the client for 5 seconds, assume they stopped
    const timeout = setTimeout(() => {
      typingUsers.delete(key);
      const eventData = { userId: socket.user.id, contextId };
      
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user_stop_typing', eventData);
      } else if (conversationId) {
        io.to(`conv:${conversationId}`).emit('user_stop_typing', eventData);
      }
    }, 5000);

    // 3. UPDATE STATE
    typingUsers.set(key, {
      userId: socket.user.id,
      username: socket.user.username,
      contextId,
      timeout
    });

    // 4. BROADCAST
    const payload = { 
      userId: socket.user.id, 
      username: socket.user.username, 
      contextId 
    };

    if (roomId) {
      // Send to room (excluding sender)
      socket.to(`room:${roomId}`).emit('user_typing', payload);
    } else if (conversationId) {
      // In DMs, send to the conversation channel (excluding sender)
      socket.to(`conv:${conversationId}`).emit('user_typing', payload);
    }
  });

  /**
   * EVENT: typing_stop
   * Explicitly signals that the user has stopped typing.
   */
  socket.on('typing_stop', (data) => {
    const { roomId, conversationId } = data;
    const contextId = roomId ? `room:${roomId}` : `conv:${conversationId}`;
    const key = `${contextId}:${socket.user.id}`;

    const entry = typingUsers.get(key);
    if (entry?.timeout) clearTimeout(entry.timeout);
    typingUsers.delete(key);

    const payload = { userId: socket.user.id, contextId };
    if (roomId) {
      socket.to(`room:${roomId}`).emit('user_stop_typing', payload);
    } else if (conversationId) {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', payload);
    }
  });

  /**
   * CLEANUP ON DISCONNECT
   */
  socket.on('disconnect', () => {
    for (const [key, value] of typingUsers.entries()) {
      if (value.userId === socket.user.id) {
        clearTimeout(value.timeout);
        typingUsers.delete(key);
      }
    }
  });
};
