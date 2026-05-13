const http = require('http');
const path = require('path');
// Load .env from current directory OR project root
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { runMigrations } = require('./database/init');
const { initSocket } = require('./sockets/index');

/**
 * SERVER BOOTSTRAP
 * Initializes the HTTP server, Socket engine, and Database migrations.
 */
const PORT = process.env.PORT || 5000;

// We create an HTTP server to allow Socket.io to attach to the same port as Express
const server = http.createServer(app);

// Initialize Real-time Engine
const io = initSocket(server);

// Initialize Database & Start Server
try {
  console.log('--- CONVO SERVER STARTING ---');
  
  // Ensure database is up to date before accepting connections
  runMigrations();

  server.listen(PORT, () => {
    console.log(`
=========================================
ðŸš€ SERVER LIVE ON PORT ${PORT}
ðŸŒ ENV: ${process.env.NODE_ENV || 'development'}
ðŸ”¥ SOCKET.IO ENGINE: READY
ðŸ“ UPLOADS DIRECTORY: ACTIVE
=========================================
    `);
  });
} catch (err) {
  console.error('CRITICAL FAILURE: Server failed to bootstrap', err);
  process.exit(1);
}
