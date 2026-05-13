const { db } = require('../database/init');

/**
 * USER MODEL
 * Handles all database operations for user identity.
 * We use parameterized queries (? placeholders) to ensure that user-provided 
 * data is never executed as SQL, completely neutralizing SQL Injection attacks.
 */
const UserModel = {
  /**
   * Creates a new user entry
   * @returns {Object} The created user
   */
  create: (id, username, email, passwordHash, avatar = null) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, avatar)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, username, email, passwordHash, avatar);
    return UserModel.findById(id);
  },

  findByEmail: (email) => {
    // We fetch the full row including password_hash for authentication logic
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findById: (id) => {
    // We explicitly exclude password_hash to prevent accidental leakage to the frontend
    return db.prepare('SELECT id, username, email, avatar, status, last_seen, created_at FROM users WHERE id = ?').get(id);
  },

  updateStatus: (id, status) => {
    return db.prepare('UPDATE users SET status = ?, last_seen = datetime(\'now\') WHERE id = ?').run(status, id);
  },

  updateLastSeen: (id) => {
    return db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(id);
  },

  updateAvatar: (id, avatarPath) => {
    return db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarPath, id);
  },

  /**
   * Search users by username. 
   * Parameterizing the LIKE clause ensures safety while allowing flexible matching.
   */
  search: (query) => {
    return db.prepare('SELECT id, username, avatar, status FROM users WHERE username LIKE ? LIMIT 20')
      .all(`%${query}%`);
  },

  findAll: () => {
    return db.prepare('SELECT id, username, avatar, status, last_seen FROM users').all();
  }
};

module.exports = UserModel;
