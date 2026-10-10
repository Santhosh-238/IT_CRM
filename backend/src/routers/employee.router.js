import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from '../controllers/employee.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Employee Statistics & KPI Metrics (<1ms Redis Cached)
router.get('/stats', requireAuth, getEmployeeStats);

// Employee List & Search
router.get('/', requireAuth, getEmployees);

// Single Employee Profile by ID
router.get('/:id', requireAuth, getEmployeeById);

// Onboard / Create New Employee
router.post(
  '/',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'PROJECT_MANAGER', 'TECH_LEAD']),
  createEmployee
);

// Update Employee Details
router.put(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'PROJECT_MANAGER', 'TECH_LEAD']),
  updateEmployee
);

// Update Employee Status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'PROJECT_MANAGER']),
  updateEmployeeStatus
);

// Delete Employee Record
router.delete(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  deleteEmployee
);

export default router;
