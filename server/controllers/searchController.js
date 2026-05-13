const UserModel = require('../models/userModel');
const RoomModel = require('../models/roomModel');
const presenceHandlers = require('../sockets/presenceHandlers');
const { db } = require('../database/init');

/**
 * SEARCH CONTROLLER
 * Provides unified discovery of users and public rooms.
 */
const searchController = {
  /**
   * Unified search across multiple entities.
   */
  searchAll: async (req, res, next) => {
    const query = req.query.q;

    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    try {
      // 1. Search Users
      // Model search handles the LIKE pattern
      const users = UserModel.search(query)
        .filter(u => u.id !== req.user.id) // Don't find yourself
        .map(u => ({
          ...u,
          type: 'user',
          isOnline: presenceHandlers.isOnline(u.id)
        }));

      // 2. Search Rooms
      // We perform a manual query here to include membership flags
      const rooms = db.prepare(`
        SELECT r.*, COUNT(rm.user_id) as member_count,
        EXISTS(SELECT 1 FROM room_members WHERE room_id = r.id AND user_id = ?) as isMember
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.name LIKE ?
        GROUP BY r.id
        LIMIT 20
      `).all(req.user.id, `%${query}%`).map(r => ({ ...r, type: 'room' }));

      res.status(200).json({
        success: true,
        results: { users, rooms }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = searchController;
