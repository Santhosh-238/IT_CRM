import { Router } from 'express';
import { logout } from '../../controllers/auth/logoutController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// POST /api/auth/logout
router.post('/logout', requireAuth, logout);

export default router;
