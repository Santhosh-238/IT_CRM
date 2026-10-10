import * as leadService from '../services/lead.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all leads
 * GET /api/leads
 */
export async function getLeads(req, res) {
  try {
    const leads = await leadService.getLeadsService(req.query);
    return sendSuccess(res, leads, 'Leads retrieved successfully');
  } catch (error) {
    console.error('getLeads error:', error);
    return sendError(res, error.message || 'Failed to fetch leads', error.status || 500);
  }
}

/**
 * Get lead by ID
 * GET /api/leads/:id
 */
export async function getLeadById(req, res) {
  try {
    const lead = await leadService.getLeadByIdService(req.params.id);
    return sendSuccess(res, lead, 'Lead retrieved');
  } catch (error) {
    return sendError(res, error.message, error.status || 500);
  }
}

/**
 * Create a lead
 * POST /api/leads
 */
export async function createLead(req, res) {
  try {
    const lead = await leadService.createLeadService(req.body);
    return sendSuccess(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    console.error('createLead error:', error);
    return sendError(res, error.message || 'Failed to create lead', error.status || 500);
  }
}

/**
 * Update lead
 * PUT /api/leads/:id
 */
export async function updateLead(req, res) {
  try {
    const lead = await leadService.updateLeadService(req.params.id, req.body);
    return sendSuccess(res, lead, 'Lead updated successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to update lead', error.status || 500);
  }
}

/**
 * Delete lead
 * DELETE /api/leads/:id
 */
export async function deleteLead(req, res) {
  try {
    const result = await leadService.deleteLeadService(req.params.id);
    return sendSuccess(res, result, 'Lead deleted successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to delete lead', error.status || 500);
  }
}

export default {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
