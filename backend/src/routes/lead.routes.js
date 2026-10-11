import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getLeads,
  getLeadStats,
  getLeadMetadata,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/lead.controller.js';

const router = Router();

// 1. KPI Statistics
router.get(
  '/stats',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadStats
);

// 2. Dropdown metadata
router.get(
  '/metadata',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadMetadata
);

// 3. List leads with filters, pagination, search
router.get(
  '/',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeads
);

// 4. Single lead by ID
router.get(
  '/:id',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadById
);

// 5. Create lead
router.post(
  '/',
  requireAuth,
  authorizePermission('leads', 'create'),
  createLead
);

// 6. Update lead
router.put(
  '/:id',
  requireAuth,
  authorizePermission('leads', 'edit'),
  updateLead
);

// 7. Delete lead
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('leads', 'delete'),
  deleteLead
);

export default router;
