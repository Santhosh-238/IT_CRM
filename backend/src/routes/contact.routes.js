import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getContacts,
  getContactById,
  getContactStats,
  getContactMetadata,
  createContact,
  updateContact,
  deleteContact,
  assignContact,
} from '../controllers/contact.controller.js';

const router = Router();

// 1. Contact Statistics & KPI metrics
router.get(
  '/stats',
  requireAuth,
  authorizePermission('contacts', 'view'),
  getContactStats
);

// 2. Dropdown metadata (Companies, Employees, Pipeline Stages)
router.get(
  '/metadata',
  requireAuth,
  authorizePermission('contacts', 'view'),
  getContactMetadata
);

// 3. Contact List with Search, Filters, Sorting & Pagination
router.get(
  '/',
  requireAuth,
  authorizePermission('contacts', 'view'),
  getContacts
);

// 4. Single Contact Details by ID
router.get(
  '/:id',
  requireAuth,
  authorizePermission('contacts', 'view'),
  getContactById
);

// 5. Create Contact
router.post(
  '/',
  requireAuth,
  authorizePermission('contacts', 'create'),
  createContact
);

// 6. Assign Contact to Employee Rep
router.put(
  '/:id/assign',
  requireAuth,
  authorizePermission('contacts', 'edit'),
  assignContact
);

// 7. Update Contact Details & Pipeline Stage
router.put(
  '/:id',
  requireAuth,
  authorizePermission('contacts', 'edit'),
  updateContact
);

// 8. Delete Contact
router.delete(
  '/:id',
  requireAuth,
  authorizePermission('contacts', 'delete'),
  deleteContact
);

export default router;
