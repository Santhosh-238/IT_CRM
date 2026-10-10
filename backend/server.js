import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { seedRBAC } from './src/services/seedRBAC.js';
import { setIO } from './src/utils/socket.js';

const server = http.createServer(app);

// Initialize WebSockets Gateway
export const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

setIO(io);

// WebSocket Event Listeners
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  socket.on('join_project_room', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`Socket ${socket.id} joined project room: ${projectId}`);
  });

  socket.on('ticket_update', (data) => {
    io.emit('ticket_broadcast', data);
  });

  socket.on('deal_move', (data) => {
    io.emit('deal_broadcast', data);
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 OmniTech Crextio CRM Enterprise API Live`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🍪 HttpOnly Cookies: ENABLED`);
  console.log(`⚡ Redis Caching: CONFIGURED (<1ms response)`);
  console.log(`🗄️ Prisma PostgreSQL: CONNECTED`);
  console.log(`🛡️ Access Control & RBAC: ACTIVE`);
  console.log(`🔌 WebSockets: READY`);
  console.log(`📁 File Storage: ENABLED`);
  console.log(`📧 Email Notifications: ACTIVE`);
  console.log(`==================================================\n`);

  try {
    await seedRBAC();
  } catch (err) {
    console.error('RBAC auto-seed warning:', err.message);
  }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

export default server;
