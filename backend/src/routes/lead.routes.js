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
  getLeadProposals,
  getLeadProposalById,
  createLeadProposal,
  updateLeadProposal,
  deleteLeadProposal,
  getLeadNegotiations,
  getLeadNegotiationStats,
  getLeadNegotiationById,
  createLeadNegotiation,
  updateLeadNegotiation,
  deleteLeadNegotiation,
  getLeadContracts,
  getLeadContractStats,
  getLeadContractById,
  createLeadContract,
  updateLeadContract,
  submitLeadContractApproval,
  approveLeadContract,
  rejectLeadContract,
  deleteLeadContract,
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

// 3. Proposals under Lead Module
router.get(
  '/proposals',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadProposals
);

router.get(
  '/proposals/:id',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadProposalById
);

router.post(
  '/proposals',
  requireAuth,
  authorizePermission('leads', 'create'),
  createLeadProposal
);

router.put(
  '/proposals/:id',
  requireAuth,
  authorizePermission('leads', 'edit'),
  updateLeadProposal
);

router.delete(
  '/proposals/:id',
  requireAuth,
  authorizePermission('leads', 'delete'),
  deleteLeadProposal
);

// 4. Negotiations under Lead Module
router.get(
  '/negotiations/stats',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadNegotiationStats
);

router.get(
  '/negotiations',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadNegotiations
);

router.get(
  '/negotiations/:id',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadNegotiationById
);

router.post(
  '/negotiations',
  requireAuth,
  authorizePermission('leads', 'create'),
  createLeadNegotiation
);

router.put(
  '/negotiations/:id',
  requireAuth,
  authorizePermission('leads', 'edit'),
  updateLeadNegotiation
);

router.delete(
  '/negotiations/:id',
  requireAuth,
  authorizePermission('leads', 'delete'),
  deleteLeadNegotiation
);

// 5. Contracts under Lead Module
router.get(
  '/contracts/stats',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadContractStats
);

router.get(
  '/contracts',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadContracts
);

router.get(
  '/contracts/:id',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeadContractById
);

router.post(
  '/contracts',
  requireAuth,
  authorizePermission('leads', 'create'),
  createLeadContract
);

router.put(
  '/contracts/:id',
  requireAuth,
  authorizePermission('leads', 'edit'),
  updateLeadContract
);

router.post(
  '/contracts/:id/submit',
  requireAuth,
  authorizePermission('leads', 'create'),
  submitLeadContractApproval
);

router.post(
  '/contracts/:id/approve',
  requireAuth,
  authorizePermission('leads', 'approve'),
  approveLeadContract
);

router.post(
  '/contracts/:id/reject',
  requireAuth,
  authorizePermission('leads', 'approve'),
  rejectLeadContract
);

router.delete(
  '/contracts/:id',
  requireAuth,
  authorizePermission('leads', 'delete'),
  deleteLeadContract
);

// 6. List leads with filters, pagination, search
router.get(
  '/',
  requireAuth,
  authorizePermission('leads', 'view'),
  getLeads
);

// 5. Single lead by ID
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
