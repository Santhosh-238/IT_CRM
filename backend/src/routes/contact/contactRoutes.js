import { Router } from 'express';
import {
  getContacts,
  getContactById,
  getContactStats,
  getContactMetadata,
  createContact,
  updateContact,
  deleteContact,
  assignContact,
} from '../../controllers/contacts/index.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// 1. Contact Statistics & KPI metrics
router.get('/stats', requireAuth, getContactStats);

// 2. Dropdown metadata (Companies, Employees, Leads)
router.get('/metadata', requireAuth, getContactMetadata);

// 3. Contact List with Search, Filters, Sorting & Pagination
router.get('/', requireAuth, getContacts);

// 4. Single Contact Details by ID
router.get('/:id', requireAuth, getContactById);

// 5. Create Contact
router.post('/', requireAuth, createContact);

// 6. Assign Contact to Employee
router.put('/:id/assign', requireAuth, assignContact);

// 7. Update Contact
router.put('/:id', requireAuth, updateContact);

// 8. Delete Contact
router.delete('/:id', requireAuth, deleteContact);

export default router;
