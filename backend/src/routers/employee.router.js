import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
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

// 1. Employee Statistics & KPI Metrics (<1ms Redis Cached)
router.get(
  '/stats',
  requireAuth,
  authorizePermission('employees', 'view'),
  getEmployeeStats
);

// 2. Employee List & Search
router.get(
  '/',
  requireAuth,
  authorizePermission('employees', 'view'),
  getEmployees
);

// 3. Single Employee Profile by ID
router.get(
  '/:id',
  requireAuth,
  authorizePermission('employees', 'view'),
  getEmployeeById
);

// 4. Onboard / Create New Employee
router.post(
  '/',
  requireAuth,
  authorizePermission('employees', 'create'),
  createEmployee
);

// 5. Update Employee Details
router.put(
  '/:id',
  requireAuth,
  authorizePermission('employees', 'edit'),
  updateEmployee
);

// 6. Update Employee Status
router.patch(
  '/:id/status',
  requireAuth,
  authorizePermission('employees', 'edit'),
  updateEmployeeStatus
);

// 7. Delete Employee Record
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('employees', 'delete'),
  deleteEmployee
);

export default router;
