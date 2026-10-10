import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  getMeetings,
  getMeetingStats,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../controllers/meeting.controller.js';

const router = Router();

// 1. Get KPI stats
router.get('/stats', requireAuth, getMeetingStats);

// 2. Get meetings list (supports date, employee, search)
router.get('/', requireAuth, getMeetings);

// 3. Get single meeting
router.get('/:id', requireAuth, getMeetingById);

// 4. Schedule new meeting
router.post('/', requireAuth, createMeeting);

// 5. Update meeting
router.put('/:id', requireAuth, updateMeeting);

// 6. Delete meeting
router.delete('/:id', requireAuth, deleteMeeting);

export default router;
