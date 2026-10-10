import { prisma } from '../config/prisma.js';

/**
 * 1. Get all leads
 */
export async function getLeadsService(queryParams = {}) {
  const { status, search } = queryParams;
  const where = {};

  if (status && status !== 'All') where.status = status;
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return leads;
}

/**
 * 2. Get lead by ID
 */
export async function getLeadByIdService(id) {
  const lead = await prisma.lead.findFirst({
    where: {
      OR: [{ id }, { leadId: id }],
    },
  });

  if (!lead) {
    const error = new Error('Lead not found');
    error.status = 404;
    throw error;
  }

  return lead;
}

/**
 * 3. Create lead
 */
export async function createLeadService(body) {
  const { title, companyName, contactName, status } = body;
  if (!title || !title.trim()) {
    const error = new Error('Lead title is required');
    error.status = 400;
    throw error;
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

  return lead;
}

/**
 * 4. Update lead
 */
export async function updateLeadService(id, body) {
  const lead = await prisma.lead.update({
    where: { id },
    data: body,
  });

  return lead;
}

/**
 * 5. Delete lead
 */
export async function deleteLeadService(id) {
  await prisma.lead.delete({ where: { id } });
  return { id };
}

export default {
  getLeadsService,
  getLeadByIdService,
  createLeadService,
  updateLeadService,
  deleteLeadService,
};
