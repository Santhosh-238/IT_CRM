import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getEmployees,
  getEmployeeById,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from '../controllers/employee.controller.js';

const router = Router();

// Employee Statistics & KPI Metrics (<1ms Redis Cached)
router.get('/stats', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployeeStats);

// Employee List & Search
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployees);

// Single Employee Profile by ID
router.get('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployeeById);

// 4. Onboard / Create New Employee
router.post(
  '/',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  createEmployee
);

// 5. Update Employee Details
router.put(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  updateEmployee
);

// 6. Update Employee Status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  updateEmployeeStatus
);

// 7. Delete Employee Record
router.delete(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  deleteEmployee
);

export default router;
