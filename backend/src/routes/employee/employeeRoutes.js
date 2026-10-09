import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from '../../controllers/employees/index.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// 1. Employee Statistics & KPI Metrics (<1ms Redis Cached)
router.get('/stats', requireAuth, getEmployeeStats);

// 2. Employee List & Search (with filters for department, status, role, pagination)
router.get('/', requireAuth, getEmployees);

// 3. Single Employee Profile by ID
router.get('/:id', requireAuth, getEmployeeById);

// 4. Onboard / Create New Employee
router.post(
  '/',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'PROJECT_MANAGER', 'TECH_LEAD']),
  createEmployee
);

// 5. Update Employee Details
router.put(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'PROJECT_MANAGER', 'TECH_LEAD']),
  updateEmployee
);

// 6. Update Employee Status (Active, Probation, On Leave, etc.)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'PROJECT_MANAGER']),
  updateEmployeeStatus
);

// 7. Delete Employee Record
router.delete(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  deleteEmployee
);

export default router;
