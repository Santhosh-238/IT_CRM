import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  getCustomers,
  getCustomerStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';

const router = Router();

// 1. KPI Statistics
router.get('/stats', requireAuth, getCustomerStats);

// 2. List Customers with search & filters
router.get('/', requireAuth, getCustomers);

// 3. Get Customer by ID
router.get('/:id', requireAuth, getCustomerById);

// 4. Create New Customer
router.post('/', requireAuth, createCustomer);

// 5. Update Customer
router.put('/:id', requireAuth, updateCustomer);

// 6. Delete Customer
router.delete('/:id', requireAuth, deleteCustomer);

export default router;
