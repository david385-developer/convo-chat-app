const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

/**
 * DATABASE INITIALIZATION
 * We use better-sqlite3 for its performance and synchronous API. 
 * Synchronous execution is highly appropriate for a chat server's local 
 * database as it eliminates the complexity of async management and 
 * race conditions during critical read/write cycles without sacrificing speed.
 */

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : (process.env.DATABASE_PATH 
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, 'convo.db'));

// Ensure directory existence
if (dbPath !== ':memory:') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

let db;
try {
  db = new Database(dbPath);
  
  /**
   * PERFORMANCE OPTIMIZATION: WAL (Write-Ahead Logging)
   * WAL mode significantly improves performance for concurrent operations by 
   * allowing multiple readers to access the database even while a writer is active.
   */
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Automatically run migrations for in-memory test databases
  if (dbPath === ':memory:') {
    runMigrations();
  }
} catch (err) {
  console.error('CRITICAL: Failed to open database', err);
  process.exit(1);
}

function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const migrationFiles = fs.readdirSync(migrationsDir).sort();

  console.log('--- EXECUTING DATABASE MIGRATIONS ---');
  
  const transaction = db.transaction(() => {
    migrationFiles.forEach(file => {
      console.log(`Migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
    });

    // Ensure 'system' user exists for foreign key constraints
    const checkSystem = db.prepare('SELECT id FROM users WHERE id = ?');
    const createSystem = db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)');
    
    if (!checkSystem.get('system')) {
      createSystem.run('system', 'System', 'system@convo.app', 'system_generated_hash');
    }

    // Seed default rooms if they don't exist
    const seedRooms = ['general', 'random', 'help'];
    const checkRoom = db.prepare('SELECT id FROM rooms WHERE name = ?');
    const createRoom = db.prepare('INSERT INTO rooms (id, name, description, created_by) VALUES (?, ?, ?, ?)');
    
    seedRooms.forEach(name => {
      if (!checkRoom.get(name)) {
        createRoom.run(name, name, `Official ${name} channel`, 'system');
      }
    });
  });

  transaction();
  console.log('--- DATABASE SYNCED ---');
};

module.exports = { db, runMigrations };
