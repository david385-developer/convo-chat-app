const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/userModel');
const RoomModel = require('../models/roomModel');
const { db } = require('../database/init');

/**
 * Helper to auto-join a user to the core platform rooms.
 */
const autoJoinDefaultRooms = (userId, username) => {
  const defaultRooms = db.prepare(`
    SELECT id FROM rooms WHERE name IN ('general', 'random', 'help')
  `).all();

  defaultRooms.forEach(room => {
    RoomModel.addMember(room.id, userId, 'member');
    console.log(`[Auth] Auto-joined ${username} to default room: ${room.id}`);
  });
};

/**
 * AUTH CONTROLLER
 */
const authController = {
  register: async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      if (UserModel.findByEmail(email)) {
        return res.status(409).json({ success: false, error: 'Email is already registered' });
      }
      if (UserModel.findByUsername(username)) {
        return res.status(409).json({ success: false, error: 'Username is already taken' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = uuidv4();
      
      const avatar = req.file ? `/uploads/${req.file.filename}` : null;

      const user = UserModel.create(userId, username, email, passwordHash, avatar);

      // AUTO-JOIN default rooms upon registration
      autoJoinDefaultRooms(user.id, user.username);

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || 'convo_dev_fallback_secret_321',
        { expiresIn: '7d' }
      );

      res.status(201).json({ success: true, user, token });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      UserModel.updateStatus(user.id, 'online');

      // Ensure user is in default rooms on login (in case they weren't before)
      autoJoinDefaultRooms(user.id, user.username);

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || 'convo_dev_fallback_secret_321',
        { expiresIn: '7d' }
      );

      const { password_hash, ...safeUser } = user;

      res.json({ success: true, user: safeUser, token });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      UserModel.updateStatus(req.user.id, 'offline');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  getMe: (req, res) => {
    res.json({ success: true, user: req.user });
  }
};

module.exports = authController;
