import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/lead.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, getLeads);
router.get('/:id', requireAuth, getLeadById);
router.post('/', requireAuth, createLead);
router.put('/:id', requireAuth, updateLead);
router.delete('/:id', requireAuth, deleteLead);

export default router;
