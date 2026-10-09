import { Router } from 'express';
import { signup } from '../../controllers/auth/signupController.js';

const router = Router();

// POST /api/auth/register & POST /api/auth/signup
router.post('/register', signup);
router.post('/signup', signup);

export default router;
