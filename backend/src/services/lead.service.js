import { prisma } from '../config/prisma.js';
import { delCache } from '../config/redis.js';
import { LeadModel } from '../models/lead.model.js';
import { generateLeadId, buildLeadFilterQuery, formatLeadResponse } from '../utils/lead.util.js';

/**
 * 1. List leads with search, filters, pagination, and sorting
 */
export async function getLeadsService(queryParams = {}) {
  const {
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = buildLeadFilterQuery(queryParams);

  const validSortFields = ['createdAt', 'updatedAt', 'name', 'companyName', 'status', 'stage'];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { [finalSortBy]: finalSortOrder },
      skip,
      take: limitNum,
    }),
  ]);

  return {
    data: leads.map(formatLeadResponse),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * 2. Get Single Lead by ID
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

  return { data: formatLeadResponse(lead) };
}

/**
 * 3. Get Lead KPI Stats
 */
export async function getLeadStatsService() {
  const [total, newCount, inProgress, won, lost] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'New' } }),
    prisma.lead.count({ where: { status: { in: ['In Progress', 'Contacted', 'Qualified'] } } }),
    prisma.lead.count({ where: { status: { in: ['Won', 'Closed Won', 'Completed', 'Complete'] } } }),
    prisma.lead.count({ where: { status: { in: ['Lost', 'Disqualified'] } } }),
  ]);

  return {
    stats: {
      total,
      new: newCount,
      inProgress,
      won,
      completed: won,
      complete: won,
      lost,
    },
  };
}

/**
 * 4. Get Lead Dropdown Metadata
 */
export async function getLeadMetadataService() {
  const metadata = await LeadModel.getDynamicMetadata();
  return { metadata };
}

/**
 * 5. Create Lead
 */
export async function createLeadService(body) {
  const {
    name,
    email,
    phone,
    contactType = 'Individual',
    profession,
    companyName,
    designation,
    address,
    source = 'Website',
    customSource,
    category = 'Service',
    productList = [],
    serviceList = [],
    status = 'New',
    stage = 'Initialization',
  } = body;

  if (!name || !name.trim()) {
    const error = new Error('Lead name is mandatory');
    error.status = 400;
    throw error;
  }

  const count = await prisma.lead.count();
  const leadId = generateLeadId(count);

  const newLead = await prisma.lead.create({
    data: {
      leadId,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      contactType: contactType || 'Individual',
      profession: profession?.trim() || null,
      companyName: companyName?.trim() || null,
      designation: designation?.trim() || null,
      address: address?.trim() || null,
      source: source || 'Website',
      customSource: customSource?.trim() || null,
      category: category || 'Service',
      productList: Array.isArray(productList) ? productList : [],
      serviceList: Array.isArray(serviceList) ? serviceList : [],
      status: status || 'New',
      stage: stage || 'Initialization',
    },
  });

  await delCache('crm:leads:*').catch(() => {});

  return {
    message: 'Lead created successfully',
    data: formatLeadResponse(newLead),
  };
}

/**
 * 6. Update Lead
 */
export async function updateLeadService(id, body) {
  const existing = await prisma.lead.findFirst({
    where: { OR: [{ id }, { leadId: id }] },
  });

  if (!existing) {
    const error = new Error('Lead not found');
    error.status = 404;
    throw error;
  }

  const {
    name,
    email,
    phone,
    contactType,
    profession,
    companyName,
    designation,
    address,
    source,
    customSource,
    category,
    productList,
    serviceList,
    status,
    stage,
  } = body;

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email ? email.trim() : null;
  if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
  if (contactType !== undefined) updateData.contactType = contactType;
  if (profession !== undefined) updateData.profession = profession ? profession.trim() : null;
  if (companyName !== undefined) updateData.companyName = companyName ? companyName.trim() : null;
  if (designation !== undefined) updateData.designation = designation ? designation.trim() : null;
  if (address !== undefined) updateData.address = address ? address.trim() : null;
  if (source !== undefined) updateData.source = source;
  if (customSource !== undefined) updateData.customSource = customSource ? customSource.trim() : null;
  if (category !== undefined) updateData.category = category;
  if (productList !== undefined) updateData.productList = Array.isArray(productList) ? productList : [];
  if (serviceList !== undefined) updateData.serviceList = Array.isArray(serviceList) ? serviceList : [];
  if (status !== undefined) updateData.status = status;
  if (stage !== undefined) updateData.stage = stage;

  const updated = await prisma.lead.update({
    where: { id: existing.id },
    data: updateData,
  });

  await delCache('crm:leads:*').catch(() => {});

  return {
    message: 'Lead updated successfully',
    data: formatLeadResponse(updated),
  };
}

/**
 * 7. Delete Lead
 */
export async function deleteLeadService(id) {
  const existing = await prisma.lead.findFirst({
    where: { OR: [{ id }, { leadId: id }] },
  });

  if (!existing) {
    const error = new Error('Lead not found');
    error.status = 404;
    throw error;
  }

  await prisma.lead.delete({
    where: { id: existing.id },
  });

  await delCache('crm:leads:*').catch(() => {});

  return {
    message: 'Lead deleted successfully',
    id: existing.id,
    leadId: existing.leadId,
  };
}

/**
 * 8. GET ALL PROPOSALS (Inside Lead Module)
 */
export async function getLeadProposalsService(query = {}) {
  const { leadId, search, status } = query;
  const where = {};

  if (leadId && leadId !== 'All') {
    where.leadId = leadId;
  }

  if (status && status !== 'All') {
    where.status = status;
  }

  if (search) {
    const q = search.trim();
    where.OR = [
      { proposalNumber: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
    ];
  }

  const proposals = await prisma.proposal.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return proposals;
}
export const getProposalsService = getLeadProposalsService;

/**
 * 9. GET SINGLE PROPOSAL BY ID
 */
export async function getLeadProposalByIdService(id) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      OR: [{ id }, { proposalNumber: id }],
    },
    include: { items: true },
  });

  if (!proposal) {
    const err = new Error('Proposal not found.');
    err.status = 404;
    throw err;
  }

  return proposal;
}
export const getProposalByIdService = getLeadProposalByIdService;

/**
 * 10. CREATE NEW PROPOSAL
 */
export async function createLeadProposalService(data, user) {
  const year = new Date().getFullYear();
  const count = await prisma.proposal.count();
  const nextNum = 1001 + count;
  const proposalNumber = data.proposalNumber || `PROP-${year}-${nextNum}`;

  const proposal = await prisma.proposal.create({
    data: {
      proposalNumber,
      leadId: data.leadId || null,
      contactId: data.contactId || null,
      contactName: data.contactName || '',
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      companyName: data.companyName || null,
      clientGst: data.clientGst || null,
      clientAddress: data.clientAddress || null,
      title: data.title || null,
      proposalDate: data.proposalDate || data.issueDate || new Date().toISOString().split('T')[0],
      validUntil: data.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: data.status || 'Draft',
      currency: data.currency || 'INR (₹)',
      subtotal: Number(data.subtotal) || Number(data.totalAmount) || 0,
      totalAmount: Number(data.totalAmount) || Number(data.subtotal) || 0,
      grandTotal: Number(data.grandTotal) || Number(data.totalAmount) || 0,
      discountPercent: Number(data.discountPercent) || 0,
      taxPercent: Number(data.taxPercent) || 0,
      paymentTerms: data.paymentTerms || 'Net 30 Days',
      documentName: data.documentName || null,
      documentUrl: data.documentUrl || null,
      documentSize: data.documentSize || null,
      notes: data.notes || null,
      terms: data.terms || data.termsConditions || null,
      items: {
        create: (data.items || []).map((it) => ({
          itemName: it.itemName || it.description || 'Deliverable',
          description: it.description || null,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          totalAmount: Number(it.totalAmount) || Number(it.total) || 0,
        })),
      },
    },
    include: { items: true },
  });

  return proposal;
}
export const createProposalService = createLeadProposalService;

/**
 * 11. UPDATE PROPOSAL
 */
export async function updateLeadProposalService(id, data, user) {
  const existing = await prisma.proposal.findFirst({
    where: {
      OR: [{ id }, { proposalNumber: id }],
    },
  });

  if (!existing) {
    const err = new Error('Proposal not found.');
    err.status = 404;
    throw err;
  }

  const updateData = {};
  if (data.contactName !== undefined) updateData.contactName = data.contactName;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
  if (data.clientGst !== undefined) updateData.clientGst = data.clientGst;
  if (data.clientAddress !== undefined) updateData.clientAddress = data.clientAddress;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.proposalDate || data.issueDate) updateData.proposalDate = data.proposalDate || data.issueDate;
  if (data.validUntil) updateData.validUntil = data.validUntil;
  if (data.status) updateData.status = data.status;
  if (data.currency) updateData.currency = data.currency;
  if (data.subtotal !== undefined) updateData.subtotal = Number(data.subtotal);
  if (data.totalAmount !== undefined) updateData.totalAmount = Number(data.totalAmount);
  if (data.grandTotal !== undefined) updateData.grandTotal = Number(data.grandTotal);
  if (data.discountPercent !== undefined) updateData.discountPercent = Number(data.discountPercent);
  if (data.taxPercent !== undefined) updateData.taxPercent = Number(data.taxPercent);
  if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
  if (data.documentName !== undefined) updateData.documentName = data.documentName;
  if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;
  if (data.documentSize !== undefined) updateData.documentSize = data.documentSize;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.terms !== undefined || data.termsConditions !== undefined) {
    updateData.terms = data.terms !== undefined ? data.terms : data.termsConditions;
  }

  if (Array.isArray(data.items)) {
    await prisma.proposalItem.deleteMany({ where: { proposalId: existing.id } });
    updateData.items = {
      create: data.items.map((it) => ({
        itemName: it.itemName || it.description || 'Deliverable',
        description: it.description || null,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalAmount: Number(it.totalAmount) || Number(it.total) || 0,
      })),
    };
  }

  const updated = await prisma.proposal.update({
    where: { id: existing.id },
    data: updateData,
    include: { items: true },
  });

  return updated;
}
export const updateProposalService = updateLeadProposalService;

/**
 * 12. DELETE PROPOSAL
 */
export async function deleteLeadProposalService(id) {
  const existing = await prisma.proposal.findFirst({
    where: {
      OR: [{ id }, { proposalNumber: id }],
    },
  });

  if (!existing) {
    const err = new Error('Proposal not found.');
    err.status = 404;
    throw err;
  }

  await prisma.proposal.delete({
    where: { id: existing.id },
  });

  return { id: existing.id, proposalNumber: existing.proposalNumber };
}
export const deleteProposalService = deleteLeadProposalService;

export default {
  getLeadsService,
  getLeadByIdService,
  getLeadStatsService,
  getLeadMetadataService,
  createLeadService,
  updateLeadService,
  deleteLeadService,
  getLeadProposalsService,
  getLeadProposalByIdService,
  createLeadProposalService,
  updateLeadProposalService,
  deleteLeadProposalService,
  getProposalsService,
  getProposalByIdService,
  createProposalService,
  updateProposalService,
  deleteProposalService,
};

