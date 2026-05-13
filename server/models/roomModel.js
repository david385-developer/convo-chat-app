const { db } = require('../database/init');

/**
 * ROOM MODEL
 * Manages the lifecycle of public channels and their memberships.
 */
const RoomModel = {
  /**
   * Creates a room and automatically joins the creator as an admin.
   */
  create: (id, name, description, createdBy) => {
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO rooms (id, name, description, created_by) VALUES (?, ?, ?, ?)').run(id, name, description, createdBy);
      db.prepare('INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)').run(id, createdBy, 'admin');
    });
    transaction();
    return RoomModel.findById(id);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  },

  findByName: (name) => {
    return db.prepare('SELECT * FROM rooms WHERE name = ?').get(name);
  },

  findAll: () => {
    return db.prepare(`
      SELECT r.*, COUNT(rm.user_id) as member_count 
      FROM rooms r 
      LEFT JOIN room_members rm ON r.id = rm.room_id 
      GROUP BY r.id
    `).all();
  },

  addMember: (roomId, userId, role = 'member') => {
    console.log(`[RoomModel] Adding user ${userId} to room ${roomId} as ${role}`);
    return db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)').run(roomId, userId, role);
  },

  removeMember: (roomId, userId) => {
    return db.prepare('DELETE FROM room_members WHERE room_id = ? AND user_id = ?').run(roomId, userId);
  },

  getMembers: (roomId) => {
    return db.prepare(`
      SELECT u.id, u.username, u.avatar, u.status, rm.role, rm.joined_at 
      FROM room_members rm 
      JOIN users u ON rm.user_id = u.id 
      WHERE rm.room_id = ?
    `).all(roomId);
  },

  isMember: (roomId, userId) => {
    const row = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
    return !!row;
  },

  getUserRooms: (userId) => {
    console.log(`[RoomModel] Fetching rooms for user ${userId}`);
    return db.prepare(`
      SELECT r.* 
      FROM rooms r 
      JOIN room_members rm ON r.id = rm.room_id 
      WHERE rm.user_id = ?
    `).all(userId);
  },

  getMemberCount: (roomId) => {
    return db.prepare('SELECT COUNT(*) as count FROM room_members WHERE room_id = ?').get(roomId).count;
  },

  update: (id, name, description) => {
    return db.prepare('UPDATE rooms SET name = ?, description = ? WHERE id = ?').run(name, description, id);
  },
  
  delete: (id) => {
    return db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  }
};

module.exports = RoomModel;
