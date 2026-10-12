import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getProjects,
  getProjectById,
  getProjectStats,
  getProjectMetadata,
  createProject,
  updateProject,
  deleteProject,
  updateProjectModules,
} from '../controllers/project.controller.js';

const router = Router();

// 1. Project KPI Stats
router.get(
  '/stats',
  requireAuth,
  authorizePermission('projects', 'view'),
  getProjectStats
);

// 2. Dropdown metadata (Employees, Contacts, Options)
router.get(
  '/metadata',
  requireAuth,
  authorizePermission('projects', 'view'),
  getProjectMetadata
);

// 3. Project List with Search, Filters, Sorting & Pagination
router.get(
  '/',
  requireAuth,
  authorizePermission('projects', 'view'),
  getProjects
);

// 4. Single Project Details
router.get(
  '/:id',
  requireAuth,
  authorizePermission('projects', 'view'),
  getProjectById
);

// 5. Create Project
router.post(
  '/',
  requireAuth,
  authorizePermission('projects', 'create'),
  createProject
);

// 6. Update Project
router.put(
  '/:id',
  requireAuth,
  authorizePermission('projects', 'edit'),
  updateProject
);

// 7. Delete Project
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('projects', 'delete'),
  deleteProject
);

// 8. Update Project Modules & End-to-End Tracking
router.put(
  '/:id/modules',
  requireAuth,
  authorizePermission('projects', 'edit'),
  updateProjectModules
);

export default router;
