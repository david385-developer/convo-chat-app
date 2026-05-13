/**
 * PRESENCE HANDLERS
 * Manages in-memory tracking of online users.
 * 
 * Why in-memory?
 * 1. Performance: O(1) lookup speed is critical for high-frequency status checks.
 * 2. Ephemerality: Presence data is transient; if the server restarts, all connections 
 *    are lost anyway, making a database persistent layer overkill for this use case.
 * 3. Scalability Note: In a multi-node production environment, this Map would be 
 *    replaced by a Redis store to share presence across server instances.
 */

const onlineUsers = new Map();
// Key: userId (string)
// Value: { socketId: string, user: { id, username, avatar } }

const PresenceHandlers = {
  /**
   * Registers a user as online.
   */
  addUser: (user, socketId) => {
    onlineUsers.set(user.id, {
      socketId,
      user: { id: user.id, username: user.username, avatar: user.avatar }
    });
    console.log(`[Presence] ${user.username} online (${onlineUsers.size} total)`);
  },

  /**
   * Removes a user from the online map.
   * Returns the removed entry so the caller can use the socketId for cleanup.
   */
  removeUser: (userId) => {
    const entry = onlineUsers.get(userId);
    onlineUsers.delete(userId);
    console.log(`[Presence] User ${userId} offline (${onlineUsers.size} total)`);
    return entry;
  },

  /**
   * Retrieves a user's presence entry.
   */
  getUser: (userId) => {
    return onlineUsers.get(userId) || null;
  },

  /**
   * Convenience method to get just the socket ID.
   */
  getSocketId: (userId) => {
    return onlineUsers.get(userId)?.socketId || null;
  },

  /**
   * Returns a flat array of all online user objects.
   */
  getOnlineUsers: () => {
    return Array.from(onlineUsers.values()).map(v => v.user);
  },

  /**
   * Checks if a user is currently connected.
   */
  isOnline: (userId) => {
    return onlineUsers.has(userId);
  },

  /**
   * Find a user by their socket ID. 
   * Useful when we only have the socket reference (e.g. during disconnect).
   */
  getUserBySocketId: (socketId) => {
    for (const entry of onlineUsers.values()) {
      if (entry.socketId === socketId) return entry.user;
    }
    return null;
  },

  /**
   * Standard registration hook for the socket index.
   */
  register: (socket, io) => {
    // Presence is primarily handled by the connection/disconnect lifecycle in index.js
  }
};

module.exports = PresenceHandlers;
