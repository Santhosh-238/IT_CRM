import * as leadService from '../services/lead.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * 1. Get all leads with pagination & search
 * GET /api/leads
 */
export async function getLeads(req, res) {
  try {
    const result = await leadService.getLeadsService(req.query);
    return res.status(200).json({
      success: true,
      message: 'Leads retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('getLeads error:', error);
    return sendError(res, error.message || 'Failed to fetch leads', error.status || 500);
  }
}

/**
 * 2. Get Lead KPI Stats
 * GET /api/leads/stats
 */
export async function getLeadStats(req, res) {
  try {
    const result = await leadService.getLeadStatsService();
    return res.status(200).json({
      success: true,
      stats: result.stats,
    });
  } catch (error) {
    console.error('getLeadStats error:', error);
    return sendError(res, error.message || 'Failed to fetch lead stats', error.status || 500);
  }
}

/**
 * 3. Get Lead Metadata
 * GET /api/leads/metadata
 */
export async function getLeadMetadata(req, res) {
  try {
    const result = await leadService.getLeadMetadataService();
    return res.status(200).json({
      success: true,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('getLeadMetadata error:', error);
    return sendError(res, error.message || 'Failed to fetch lead metadata', error.status || 500);
  }
}

/**
 * 4. Get Lead by ID
 * GET /api/leads/:id
 */
export async function getLeadById(req, res) {
  try {
    const result = await leadService.getLeadByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return sendError(res, error.message, error.status || 500);
  }
}

/**
 * 5. Create a lead
 * POST /api/leads
 */
export async function createLead(req, res) {
  try {
    const result = await leadService.createLeadService(req.body);
    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('createLead error:', error);
    return sendError(res, error.message || 'Failed to create lead', error.status || 500);
  }
}

/**
 * 6. Update lead
 * PUT /api/leads/:id
 */
export async function updateLead(req, res) {
  try {
    const result = await leadService.updateLeadService(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('updateLead error:', error);
    return sendError(res, error.message || 'Failed to update lead', error.status || 500);
  }
}

/**
 * 7. Delete lead
 * DELETE /api/leads/:id
 */
export async function deleteLead(req, res) {
  try {
    const result = await leadService.deleteLeadService(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.id, leadId: result.leadId },
    });
  } catch (error) {
    console.error('deleteLead error:', error);
    return sendError(res, error.message || 'Failed to delete lead', error.status || 500);
  }
}

/**
 * 8. Get all proposals (Lead Module)
 * GET /api/leads/proposals
 */
export async function getLeadProposals(req, res) {
  try {
    const proposals = await leadService.getLeadProposalsService(req.query);
    return res.status(200).json({
      success: true,
      message: 'Proposals retrieved successfully.',
      data: proposals,
    });
  } catch (error) {
    console.error('getLeadProposals error:', error);
    return sendError(res, error.message || 'Failed to fetch proposals', error.status || 500);
  }
}
export const getProposals = getLeadProposals;

/**
 * 9. Get single proposal by ID
 * GET /api/leads/proposals/:id
 */
export async function getLeadProposalById(req, res) {
  try {
    const proposal = await leadService.getLeadProposalByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('getLeadProposalById error:', error);
    return sendError(res, error.message || 'Failed to fetch proposal', error.status || 500);
  }
}
export const getProposalById = getLeadProposalById;

/**
 * 10. Create new proposal
 * POST /api/leads/proposals
 */
export async function createLeadProposal(req, res) {
  try {
    const proposal = await leadService.createLeadProposalService(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Proposal created successfully.',
      data: proposal,
    });
  } catch (error) {
    console.error('createLeadProposal error:', error);
    return sendError(res, error.message || 'Failed to create proposal', error.status || 500);
  }
}
export const createProposal = createLeadProposal;

/**
 * 11. Update proposal
 * PUT /api/leads/proposals/:id
 */
export async function updateLeadProposal(req, res) {
  try {
    const proposal = await leadService.updateLeadProposalService(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Proposal updated successfully.',
      data: proposal,
    });
  } catch (error) {
    console.error('updateLeadProposal error:', error);
    return sendError(res, error.message || 'Failed to update proposal', error.status || 500);
  }
}
export const updateProposal = updateLeadProposal;

/**
 * 12. Delete proposal
 * DELETE /api/leads/proposals/:id
 */
export async function deleteLeadProposal(req, res) {
  try {
    const result = await leadService.deleteLeadProposalService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully.',
      data: result,
    });
  } catch (error) {
    console.error('deleteLeadProposal error:', error);
    return sendError(res, error.message || 'Failed to delete proposal', error.status || 500);
  }
}
export const deleteProposal = deleteLeadProposal;

export default {
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
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
};

