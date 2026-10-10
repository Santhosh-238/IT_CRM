import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getRoles,
  getRoleById,
  getSystemModules,
  createRole,
  updateRole,
  cloneRole,
  deleteRole,
  getUsersWithRoles,
  assignUserRole,
  bulkAssignUserRoles,
  getAuditLogs,
  getMyPermissions,
} from '../controllers/accessControl.controller.js';

const router = Router();

// 1. Current user permissions (Accessible by all authenticated users)
router.get('/my-permissions', requireAuth, getMyPermissions);

// 2. System modules catalogue
router.get('/modules', requireAuth, getSystemModules);

// 3. Roles management
router.get(
  '/roles',
  requireAuth,
  authorizePermission('access_control', 'view'),
  getRoles
);

router.get(
  '/roles/:id',
  requireAuth,
  authorizePermission('access_control', 'view'),
  getRoleById
);

router.post(
  '/roles',
  requireAuth,
  authorizePermission('access_control', 'create'),
  createRole
);

router.put(
  '/roles/:id',
  requireAuth,
  authorizePermission('access_control', 'edit'),
  updateRole
);

router.post(
  '/roles/:id/clone',
  requireAuth,
  authorizePermission('access_control', 'create'),
  cloneRole
);

router.delete(
  '/roles/:id',
  requireAuth,
  authorizePermission('access_control', 'delete'),
  deleteRole
);

// 4. User Role Assignments
router.get(
  '/users',
  requireAuth,
  authorizePermission('access_control', 'view'),
  getUsersWithRoles
);

router.patch(
  '/users/:userId/role',
  requireAuth,
  authorizePermission('access_control', 'edit'),
  assignUserRole
);

router.post(
  '/users/bulk-role',
  requireAuth,
  authorizePermission('access_control', 'edit'),
  bulkAssignUserRoles
);

// 5. Audit logs
router.get(
  '/audit-logs',
  requireAuth,
  authorizePermission('access_control', 'view'),
  getAuditLogs
);

export default router;
