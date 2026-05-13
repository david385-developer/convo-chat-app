const { v4: uuidv4 } = require('uuid');
const RoomModel = require('../models/roomModel');
const MessageModel = require('../models/messageModel');

/**
 * ROOM CONTROLLER
 * Manages the lifecycle and membership of public chat channels.
 */
const roomController = {
  createRoom: async (req, res, next) => {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return res.status(400).json({ success: false, error: 'Name must be between 3 and 50 characters' });
    }

    const sanitizedName = trimmedName.toLowerCase().replace(/\s+/g, '-');

    try {
      const existing = RoomModel.findByName(sanitizedName);
      if (existing) {
        return res.status(409).json({ success: false, error: 'Room name already taken' });
      }

      const id = uuidv4();
      const room = RoomModel.create(id, sanitizedName, description, req.user.id);
      
      res.status(201).json({ success: true, room });
    } catch (err) {
      next(err);
    }
  },

  getRooms: async (req, res, next) => {
    try {
      const rooms = RoomModel.findAll();
      
      const roomsWithMeta = rooms.map(room => ({
        ...room,
        isMember: RoomModel.isMember(room.id, req.user.id)
      }));

      res.status(200).json({ success: true, rooms: roomsWithMeta });
    } catch (err) {
      next(err);
    }
  },

  getRoom: async (req, res, next) => {
    try {
      console.log(`[RoomController] Fetching room details for ${req.params.id}`);
      const room = RoomModel.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
      }

      room.member_count = RoomModel.getMemberCount(room.id);
      room.isMember = RoomModel.isMember(room.id, req.user.id);

      res.status(200).json({ success: true, room });
    } catch (err) {
      next(err);
    }
  },

  joinRoom: async (req, res, next) => {
    try {
      const room = RoomModel.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
      }

      RoomModel.addMember(room.id, req.user.id, 'member');
      
      res.status(200).json({ 
        success: true, 
        message: 'Joined room successfully',
        room: { ...room, isMember: true }
      });
    } catch (err) {
      next(err);
    }
  },

  leaveRoom: async (req, res, next) => {
    try {
      RoomModel.removeMember(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: 'Left room successfully' });
    } catch (err) {
      next(err);
    }
  },

  getRoomMembers: async (req, res, next) => {
    try {
      const members = RoomModel.getMembers(req.params.id);
      res.status(200).json({ success: true, members });
    } catch (err) {
      next(err);
    }
  },

  /**
   * getRoomMessages
   * Fetches paginated history. Crucial for Layer 7 & 8 visibility.
   */
  getRoomMessages: async (req, res, next) => {
    const roomId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    console.log(`[RoomController] getRoomMessages for ${roomId} (limit: ${limit}, offset: ${offset})`);

    try {
      // Fetch newest first
      const messages = MessageModel.findByRoom(roomId, limit, offset);
      
      const hasMore = messages.length === limit;

      // Reverse before sending to frontend for correct scroll order
      res.status(200).json({ 
        success: true, 
        messages: messages.reverse(), 
        hasMore 
      });
    } catch (err) {
      console.error('[RoomController] Failed to get room messages:', err);
      next(err);
    }
  },
  
  updateRoom: async (req, res, next) => {
    const { name, description } = req.body;
    try {
      const room = RoomModel.findById(req.params.id);
      if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
      
      // Permission check
      if (room.created_by !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Only the room creator can update settings' });
      }

      RoomModel.update(room.id, name || room.name, description || room.description);
      res.status(200).json({ success: true, message: 'Room updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  deleteRoom: async (req, res, next) => {
    try {
      const room = RoomModel.findById(req.params.id);
      if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
      
      // Permission check
      if (room.created_by !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Only the room creator can delete this room' });
      }

      RoomModel.delete(room.id);
      res.status(200).json({ success: true, message: 'Room deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = roomController;
