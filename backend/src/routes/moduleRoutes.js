import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { authorizePermission } from '../middleware/authorizePermission.js';
import {
  getModules,
  getModuleCategories,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
} from '../controllers/modules/index.js';

const router = Router();

// 1. Get all modules catalogue (system + custom modules)
router.get('/', requireAuth, getModules);

// 2. Get distinct module categories
router.get('/categories', requireAuth, getModuleCategories);

// 3. Get single module by ID
router.get('/:id', requireAuth, getModuleById);

// 4. Create new custom module
router.post(
  '/',
  requireAuth,
  authorizePermission('access_control', 'create'),
  createModule
);

// 5. Update custom module
router.put(
  '/:id',
  requireAuth,
  authorizePermission('access_control', 'edit'),
  updateModule
);

// 6. Delete custom module
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('access_control', 'delete'),
  deleteModule
);

export default router;
