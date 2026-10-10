import { Router } from 'express';
import {
  getDashboardStats,
  getRedisStatus,
  clearAllDatabaseData,
} from '../controllers/crm.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Redis Status & Space Monitor
router.get('/redis/status', getRedisStatus);

// Database Wipe / Reset
router.post('/database/clear', requireAuth, clearAllDatabaseData);
router.delete('/database/clear', requireAuth, clearAllDatabaseData);

// Dashboard Metrics (Cached in Redis <1ms)
router.get('/dashboard/stats', requireAuth, getDashboardStats);

export default router;
