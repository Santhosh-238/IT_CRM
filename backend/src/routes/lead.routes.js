import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/lead.controller.js';

const router = Router();

// 1. Get all leads
router.get(
  '/',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeads
);

// 2. Get lead by ID
router.get(
  '/:id',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadById
);

// 3. Create lead
router.post(
  '/',
  requireAuth,
  authorizePermission('leads', 'create'),
  createLead
);

// 4. Update lead
router.put(
  '/:id',
  requireAuth,
  authorizePermission('leads', 'edit'),
  updateLead
);

// 5. Delete lead
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('leads', 'delete'),
  deleteLead
);

export default router;
