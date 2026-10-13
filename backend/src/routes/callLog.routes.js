import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  getCallLogs,
  getCallLogStats,
  getCallLogById,
  createCallLog,
  updateCallLog,
  deleteCallLog,
} from '../controllers/callLog.controller.js';

const router = Router();

// 1. Get KPI stats
router.get('/stats', requireAuth, getCallLogStats);

// 2. Get call logs list (supports filters, search)
router.get('/', requireAuth, getCallLogs);

// 3. Get single call log
router.get('/:id', requireAuth, getCallLogById);

// 4. Log a new call
router.post('/', requireAuth, createCallLog);

// 5. Update call log
router.put('/:id', requireAuth, updateCallLog);

// 6. Delete call log
router.delete('/:id', requireAuth, deleteCallLog);

export default router;
