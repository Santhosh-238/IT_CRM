import { Router } from 'express';
import signupRoutes from './signupRoutes.js';
import loginRoutes from './loginRoutes.js';
import logoutRoutes from './logoutRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const authRouter = Router();

// Modular Sub-routes
authRouter.use('/', signupRoutes);
authRouter.use('/', loginRoutes);
authRouter.use('/', logoutRoutes);
authRouter.use('/', sessionRoutes);

export default authRouter;
export { signupRoutes, loginRoutes, logoutRoutes, sessionRoutes };
