import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { getCacheStats } from './config/redis.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Core Middlewares
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Enables HttpOnly cookies across origins
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. Static File Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Health Check & Cache Status Endpoint
app.get('/api/health', async (_req, res) => {
  const cacheStats = await getCacheStats();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ITech CRM API',
    cacheEngine: cacheStats,
  });
});

// 4. Mount API Routes
app.use('/api', apiRouter);

// 5. 404 Route Not Found Handler
app.use(notFoundHandler);

// 6. Global Exception & Error Handler
app.use(errorHandler);

export default app;
