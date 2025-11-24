require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const { setupSocketHandlers } = require('./handlers/socketHandlers');

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create HTTP Server
const server = http.createServer(app);

// Socket.io Configuration
const io = socketIO(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Connection tracking
const connectedUsers = new Map();

// User count tracking handler (separate from quiz handlers)
io.on('connection', (socket) => {
  const connectionTime = new Date().toISOString();

  // Track connected user
  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: Date.now(),
    connectedAtISO: connectionTime
  });

  // Broadcast current user count to all clients
  const userCount = connectedUsers.size;
  io.emit('user-count', userCount);

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove from tracking
    connectedUsers.delete(socket.id);

    // Broadcast updated user count
    const updatedUserCount = connectedUsers.size;
    io.emit('user-count', updatedUserCount);
  });
});

// Set up quiz-specific Socket.io event handlers
setupSocketHandlers(io);

// Server Event Handlers
server.on('listening', () => {
  console.log('='.repeat(50));
  console.log('🚀 Math Quiz Backend Server');
  console.log('='.repeat(50));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log('='.repeat(50));
  console.log('✅ HTTP Server is ready');
  console.log('✅ WebSocket Server is ready');
  console.log('🔌 Waiting for connections...');
  console.log('');
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful Shutdown Handler
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received. Closing server gracefully...');

  // Close WebSocket connections
  io.close(() => {
    console.log('✅ WebSocket connections closed');

    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP Server closed');
      console.log(`📊 Total connections during session: ${connectedUsers.size}`);
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received. Closing server gracefully...');

  // Close WebSocket connections
  io.close(() => {
    console.log('✅ WebSocket connections closed');

    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP Server closed');
      console.log(`📊 Total connections during session: ${connectedUsers.size}`);
      process.exit(0);
    });
  });
});

// Start Server
server.listen(PORT);

// Export for testing purposes
module.exports = { server, io };
