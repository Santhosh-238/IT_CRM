import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getDashboardStats,
  getRedisStatus,
  clearAllDatabaseData,
} from '../controllers/crm.controller.js';

const router = Router();

// 1. Dashboard Metrics & Analytics (Cached in Redis <1ms)
router.get(
  '/dashboard/stats',
  requireAuth,
  authorizePermission('dashboard', 'view'),
  getDashboardStats
);

// 2. Redis Status & In-Memory Space Monitor
router.get(
  '/redis/status',
  requireAuth,
  authorizePermission('dashboard', 'view'),
  getRedisStatus
);

// 3. Database Wipe / Reset (Super Admin Only)
router.post(
  '/database/clear',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  clearAllDatabaseData
);

router.delete(
  '/database/clear',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  clearAllDatabaseData
);

export default router;
