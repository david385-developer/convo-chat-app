const RoomModel = require('../models/roomModel');

/**
 * VERIFY ROOM MEMBER MIDDLEWARE
 * Ensures the authenticated user is a member of the room.
 * For public rooms, it auto-joins the user if they aren't already a member.
 */
const verifyRoomMember = (req, res, next) => {
  const roomId = req.params.id || req.params.roomId;
  const userId = req.user.id;

  console.log(`[verifyRoomMember] Checking user ${userId} in room ${roomId}`);

  const isMember = RoomModel.isMember(roomId, userId);

  if (!isMember) {
    // Check if room is public (non-private)
    const room = RoomModel.findById(roomId);
    
    if (room && !room.is_private) {
      // Auto-join public room for a better user experience
      RoomModel.addMember(roomId, userId, 'member');
      console.log(`[verifyRoomMember] Auto-joined user ${userId} to public room ${roomId}`);
      return next();
    }

    console.log(`[verifyRoomMember] DENIED: user ${userId} is not a member of room ${roomId}`);
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. You are not a member of this room.' 
    });
  }

  console.log(`[verifyRoomMember] ALLOWED: user ${userId} is a member of room ${roomId}`);
  next();
};

module.exports = verifyRoomMember;
