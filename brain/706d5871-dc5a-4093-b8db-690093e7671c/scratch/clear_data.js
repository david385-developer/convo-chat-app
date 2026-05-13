const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'server', 'database', 'convo.db');
const db = new Database(dbPath);

console.log('--- RESETTING DATABASE DATA ---');

try {
  db.transaction(() => {
    // Delete data while keeping the schema
    // Orders matter due to foreign keys
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM read_receipts').run();
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM conversations').run();
    
    // Delete users except 'system'
    db.prepare('DELETE FROM users WHERE id != "system"').run();
    
    // Delete rooms except defaults
    db.prepare('DELETE FROM rooms WHERE created_by != "system"').run();
    
    console.log('Database cleared successfully (kept system accounts).');
  })();
} catch (err) {
  console.error('Failed to clear database:', err);
} finally {
  db.close();
}
