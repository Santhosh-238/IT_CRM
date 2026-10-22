import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizePermission } from '../middlewares/permission.middleware.js';
import {
  getBillingDashboard,
  getProductsServices,
  createProductServiceItem,
  updateProductServiceItem,
  deleteProductServiceItem,
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  convertQuotationToOrder,
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  getBillingProjects,
  getMilestones,
  createMilestone,
  updateMilestone,
  approveMilestone,
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  cancelInvoice,
  getPayments,
  getPaymentById,
  recordPayment,
  getBillingReports,
  getBillingSettings,
  updateBillingSettings,
  getBillingAuditLogs,
} from '../controllers/billing.controller.js';

const router = Router();

// =============================================================================
// 1. BILLING DASHBOARD
// =============================================================================
router.get('/dashboard', requireAuth, authorizePermission('billing', 'view'), getBillingDashboard);

// =============================================================================
// 2. PRODUCTS & SERVICES CATALOGUE
// =============================================================================
router.get('/products-services', requireAuth, authorizePermission('billing', 'view'), getProductsServices);
router.post('/products-services', requireAuth, authorizePermission('billing', 'create'), createProductServiceItem);
router.put('/products-services/:id', requireAuth, authorizePermission('billing', 'edit'), updateProductServiceItem);
router.delete('/products-services/:id', requireAuth, authorizePermission('billing', 'delete'), deleteProductServiceItem);

// =============================================================================
// 3. QUOTATIONS
// =============================================================================
router.get('/quotations', requireAuth, authorizePermission('billing', 'view'), getQuotations);
router.get('/quotations/:id', requireAuth, authorizePermission('billing', 'view'), getQuotationById);
router.post('/quotations', requireAuth, authorizePermission('billing', 'create'), createQuotation);
router.put('/quotations/:id', requireAuth, authorizePermission('billing', 'edit'), updateQuotation);
router.post('/quotations/:id/convert', requireAuth, authorizePermission('billing', 'create'), convertQuotationToOrder);

// =============================================================================
// 4. SALES ORDERS & CONTRACTS
// =============================================================================
router.get('/orders', requireAuth, authorizePermission('billing', 'view'), getSalesOrders);
router.get('/orders/:id', requireAuth, authorizePermission('billing', 'view'), getSalesOrderById);
router.post('/orders', requireAuth, authorizePermission('billing', 'create'), createSalesOrder);
router.put('/orders/:id', requireAuth, authorizePermission('billing', 'edit'), updateSalesOrder);

// =============================================================================
// 5. PROJECTS & MILESTONES
// =============================================================================
router.get('/projects', requireAuth, authorizePermission('billing', 'view'), getBillingProjects);
router.get('/milestones', requireAuth, authorizePermission('billing', 'view'), getMilestones);
router.post('/milestones', requireAuth, authorizePermission('billing', 'create'), createMilestone);
router.put('/milestones/:id', requireAuth, authorizePermission('billing', 'edit'), updateMilestone);
router.post('/milestones/:id/approve', requireAuth, authorizePermission('billing', 'approve'), approveMilestone);

// =============================================================================
// 6. INVOICES
// =============================================================================
router.get('/invoices', requireAuth, authorizePermission('billing', 'view'), getInvoices);
router.get('/invoices/:id', requireAuth, authorizePermission('billing', 'view'), getInvoiceById);
router.post('/invoices', requireAuth, authorizePermission('billing', 'create'), createInvoice);
router.put('/invoices/:id', requireAuth, authorizePermission('billing', 'edit'), updateInvoice);
router.post('/invoices/:id/cancel', requireAuth, authorizePermission('billing', 'delete'), cancelInvoice);

// =============================================================================
// 7. PAYMENTS
// =============================================================================
router.get('/payments', requireAuth, authorizePermission('billing', 'view'), getPayments);
router.get('/payments/:id', requireAuth, authorizePermission('billing', 'view'), getPaymentById);
router.post('/payments', requireAuth, authorizePermission('billing', 'create'), recordPayment);

// =============================================================================
// 8. BILLING REPORTS
// =============================================================================
router.get('/reports', requireAuth, authorizePermission('billing', 'export'), getBillingReports);

// =============================================================================
// 9. BILLING SETTINGS & AUDIT LOGS
// =============================================================================
router.get('/settings', requireAuth, authorizePermission('billing', 'view'), getBillingSettings);
router.put('/settings', requireAuth, authorizePermission('billing', 'edit'), updateBillingSettings);
router.get('/audit-logs', requireAuth, authorizePermission('billing', 'view'), getBillingAuditLogs);

export default router;
