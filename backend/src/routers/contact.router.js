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
} from '../controllers/contact.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Contact Statistics & KPI metrics
router.get('/stats', requireAuth, getContactStats);

// Dropdown metadata (Companies, Employees, Leads)
router.get('/metadata', requireAuth, getContactMetadata);

// Contact List with Search, Filters, Sorting & Pagination
router.get('/', requireAuth, getContacts);

// Single Contact Details by ID
router.get('/:id', requireAuth, getContactById);

// Create Contact
router.post('/', requireAuth, createContact);

// Assign Contact to Employee
router.put('/:id/assign', requireAuth, assignContact);

// Update Contact
router.put('/:id', requireAuth, updateContact);

// Delete Contact
router.delete('/:id', requireAuth, deleteContact);

export default router;
