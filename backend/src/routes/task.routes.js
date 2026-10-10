import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js';

const router = Router();

// 1. Get all tasks
router.get(
  '/',
  requireAuth,
  authorizePermission('tasks', 'view'),
  getTasks
);

// 2. Get task by ID
router.get(
  '/:id',
  requireAuth,
  authorizePermission('tasks', 'view'),
  getTaskById
);

// 3. Create task
router.post(
  '/',
  requireAuth,
  authorizePermission('tasks', 'create'),
  createTask
);

// 4. Update task
router.put(
  '/:id',
  requireAuth,
  authorizePermission('tasks', 'edit'),
  updateTask
);

// 5. Delete task
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('tasks', 'delete'),
  deleteTask
);

export default router;
