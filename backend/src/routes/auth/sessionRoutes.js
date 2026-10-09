import { Router } from 'express';
import { getCurrentUser } from '../../controllers/auth/sessionController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/auth/me
router.get('/me', requireAuth, getCurrentUser);

export default router;
