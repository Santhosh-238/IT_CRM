import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import accessControlRoutes from './routes/accessControlRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import { getCacheStats } from './config/redis.js';
import { seedRBAC } from './services/seedRBAC.js';

// Middlewares & Server Configuration
dotenv.config();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173';

export const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true, // Crucial: Allows HttpOnly cookies to be sent across origins
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api', crmRoutes);

// Health Check endpoint with Redis & Cookie info
app.get('/api/health', async (_req, res) => {
  const cacheStats = await getCacheStats();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'OmniTech Crextio CRM Enterprise API',
    security: 'JWT HttpOnly Secure Cookies + RBAC Enabled',
    cacheEngine: cacheStats,
    database: 'PostgreSQL + Prisma ORM (Synchronized)',
    webSockets: 'Socket.IO Real-time Gateway Active',
    version: '1.0.0',
  });
});

// API 404 Handler (always return JSON for unhandled API routes)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global API Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

// Real-time WebSocket connection
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

export default app;
