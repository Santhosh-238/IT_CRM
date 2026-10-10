import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all leads
 * GET /api/leads
 */
export async function getLeads(req, res) {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, leads, 'Leads retrieved successfully');
  } catch (error) {
    console.error('getLeads error:', error);
    return sendError(res, error.message || 'Failed to fetch leads', 500);
  }
}

/**
 * Get lead by ID
 * GET /api/leads/:id
 */
export async function getLeadById(req, res) {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }
    return sendSuccess(res, lead, 'Lead retrieved');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
}

/**
 * Create a lead
 * POST /api/leads
 */
export async function createLead(req, res) {
  try {
    const { title, companyName, contactName, status } = req.body;
    if (!title || !title.trim()) {
      return sendError(res, 'Lead title is required', 400);
    }

    const count = await prisma.lead.count();
    const leadId = `LED-${1000 + count + 1}`;

    const lead = await prisma.lead.create({
      data: {
        leadId,
        title: title.trim(),
        companyName: companyName?.trim() || null,
        contactName: contactName?.trim() || null,
        status: status || 'New',
      },
    });

    return sendSuccess(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    console.error('createLead error:', error);
    return sendError(res, error.message || 'Failed to create lead', 500);
  }
}

/**
 * Update lead
 * PUT /api/leads/:id
 */
export async function updateLead(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    return sendSuccess(res, lead, 'Lead updated successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to update lead', 500);
  }
}

/**
 * Delete lead
 * DELETE /api/leads/:id
 */
export async function deleteLead(req, res) {
  try {
    const { id } = req.params;
    await prisma.lead.delete({ where: { id } });
    return sendSuccess(res, { id }, 'Lead deleted successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to delete lead', 500);
  }
}

export default {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
