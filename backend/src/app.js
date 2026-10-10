import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { getCacheStats } from './config/redis.js';
import apiRouter from './routers/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Core Middlewares
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Allows HttpOnly cookies to be sent across origins
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. Static File Uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Health Check Endpoint
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

// 4. API Routes (Mount all routers)
app.use('/api', apiRouter);

// 5. 404 Handler
app.use(notFoundHandler);

// 6. Global Error Handler
app.use(errorHandler);

export default app;
