const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const presenceHandlers = require('./presenceHandlers');
const messageHandlers = require('./messageHandlers');
const roomHandlers = require('./roomHandlers');
const typingHandlers = require('./typingHandlers');
const receiptHandlers = require('./receiptHandlers');
const notificationHandlers = require('./notificationHandlers');
const userModel = require('../models/userModel');
const roomModel = require('../models/roomModel');
const conversationModel = require('../models/conversationModel');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'convo_dev_fallback_secret_321');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.username} (${socket.id})`);

    // 1. Presence Logic
    presenceHandlers.addUser(socket.user, socket.id);
    userModel.updateStatus(socket.user.id, 'online');
    
    io.emit('user_online', {
      userId: socket.user.id,
      user: {
        id: socket.user.id,
        username: socket.user.username,
        avatar: socket.user.avatar
      }
    });

    // 2. *** CRITICAL: AUTO-JOIN ROOMS & DMs ***
    // This ensures the user receives messages for all their rooms and DMs in real-time
    const userRooms = roomModel.getUserRooms(socket.user.id);
    userRooms.forEach(room => {
      const roomChannel = `room:${room.id}`;
      socket.join(roomChannel);
      console.log(`[Socket] ${socket.user.username} auto-joined room: ${roomChannel}`);
    });

    const userConvs = conversationModel.getUserConversations(socket.user.id);
    userConvs.forEach(conv => {
      const convChannel = `conv:${conv.id}`;
      socket.join(convChannel);
      console.log(`[Socket] ${socket.user.username} auto-joined conversation: ${convChannel}`);
    });

    // 3. Register Event Handlers
    messageHandlers.register(socket, io);
    roomHandlers.register(socket, io);
    typingHandlers.register(socket, io);
    receiptHandlers.register(socket, io);
    notificationHandlers.register(socket, io);

    // 4. Initial Presence List
    socket.emit('online_users_list', presenceHandlers.getOnlineUsers());

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.user.username} (${reason})`);
      presenceHandlers.removeUser(socket.user.id);
      userModel.updateStatus(socket.user.id, 'offline');
      userModel.updateLastSeen(socket.user.id);
      io.emit('user_offline', { userId: socket.user.id });
    });
  });

  return io;
}

module.exports = { initSocket };
