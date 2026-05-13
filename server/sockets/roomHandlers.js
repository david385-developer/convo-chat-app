const roomModel = require('../models/roomModel');

/**
 * ROOM HANDLERS
 */
module.exports.register = (socket, io) => {

  /**
   * EVENT: join_room
   * Explicitly joins a user to a room channel.
   */
  socket.on('join_room', (data) => {
    const { roomId } = data;
    if (!roomId) return;

    console.log(`[RoomHandler] User ${socket.user.username} joining room ${roomId}`);

    // Ensure database membership for public rooms
    const isMember = roomModel.isMember(roomId, socket.user.id);
    if (!isMember) {
      const room = roomModel.findById(roomId);
      if (room && !room.is_private) {
        roomModel.addMember(roomId, socket.user.id);
        console.log(`[RoomHandler] Auto-joined ${socket.user.username} to public room ${roomId} in DB`);
      }
    }

    // Subscribe Socket to Channel
    const roomChannel = `room:${roomId}`;
    socket.join(roomChannel);

    // Notify room of new presence
    const members = roomModel.getMembers(roomId);
    io.to(roomChannel).emit('room_members_updated', {
      roomId,
      members,
      joinedUser: {
        id: socket.user.id,
        username: socket.user.username,
        avatar: socket.user.avatar
      }
    });

    socket.emit('room_joined', { roomId });
    console.log(`[RoomHandler] ${socket.user.username} successfully joined socket channel: ${roomChannel}`);
  });

  socket.on('leave_room', (data) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.leave(`room:${roomId}`);
    
    const members = roomModel.getMembers(roomId);
    io.to(`room:${roomId}`).emit('room_members_updated', {
      roomId,
      members,
      leftUserId: socket.user.id
    });
    
    console.log(`[RoomHandler] ${socket.user.username} left room ${roomId}`);
  });

  /**
   * EVENT: join_all_rooms
   * Used on initial connection to sync all current memberships.
   */
  socket.on('join_all_rooms', () => {
    console.log(`[RoomHandler] join_all_rooms triggered for ${socket.user.username}`);
    const rooms = roomModel.getUserRooms(socket.user.id);
    rooms.forEach(room => {
      socket.join(`room:${room.id}`);
    });
    console.log(`[RoomHandler] ${socket.user.username} sync-joined ${rooms.length} rooms`);
    socket.emit('rooms_joined', { count: rooms.length });
  });
};
