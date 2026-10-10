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

<<<<<<< Updated upstream
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
=======
// Employee Statistics & KPI Metrics (<1ms Redis Cached)
router.get('/stats', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployeeStats);

// Employee List & Search
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployees);

// Single Employee Profile by ID
router.get('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployeeById);
>>>>>>> Stashed changes

// 4. Onboard / Create New Employee
router.post(
  '/',
  requireAuth,
<<<<<<< Updated upstream
  authorizePermission('employees', 'create'),
=======
  requireRole(['SUPER_ADMIN', 'ADMIN']),
>>>>>>> Stashed changes
  createEmployee
);

// 5. Update Employee Details
router.put(
  '/:id',
  requireAuth,
<<<<<<< Updated upstream
  authorizePermission('employees', 'edit'),
=======
  requireRole(['SUPER_ADMIN', 'ADMIN']),
>>>>>>> Stashed changes
  updateEmployee
);

// 6. Update Employee Status
router.patch(
  '/:id/status',
  requireAuth,
<<<<<<< Updated upstream
  authorizePermission('employees', 'edit'),
=======
  requireRole(['SUPER_ADMIN', 'ADMIN']),
>>>>>>> Stashed changes
  updateEmployeeStatus
);

// 7. Delete Employee Record
router.delete(
  '/:id',
  requireAuth,
<<<<<<< Updated upstream
  authorizePermission('employees', 'delete'),
=======
  requireRole(['SUPER_ADMIN', 'ADMIN']),
>>>>>>> Stashed changes
  deleteEmployee
);

export default router;
