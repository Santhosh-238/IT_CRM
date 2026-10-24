import { prisma } from '../config/prisma.js';
import { delCache } from '../config/redis.js';
import { LeadModel } from '../models/lead.model.js';
import {
  generateLeadId,
  buildLeadFilterQuery,
  formatLeadResponse,
  generateNegotiationId,
  formatNegotiationResponse,
  generateContractId,
  formatContractResponse,
  buildContractFilterQuery,
} from '../utils/lead.util.js';

/**
 * 1. List leads with search, filters, pagination, and sorting
 */
export async function getLeadsService(queryParams = {}, currentUser = null) {
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

  // Role-Based Data Access: Super Admin sees all leads.
  // Non-admin employees strictly see ONLY leads assigned to them!
  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = !currentUser || roleUpper === 'SUPER_ADMIN' || roleUpper.includes('ADMIN');

  if (!isSuperAdmin) {
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          currentUser?.email ? { email: { equals: currentUser.email, mode: 'insensitive' } } : null,
          currentUser?.name ? { name: { equals: currentUser.name, mode: 'insensitive' } } : null,
          currentUser?.id ? { id: currentUser.id } : null,
        ].filter(Boolean),
      },
    });

    const assignedMatch = [];
    if (emp?.id) assignedMatch.push({ assignedTo: emp.id });
    if (emp?.empCode) assignedMatch.push({ assignedTo: emp.empCode });
    if (emp?.name) assignedMatch.push({ assignedToName: { equals: emp.name, mode: 'insensitive' } });
    if (currentUser?.id) assignedMatch.push({ assignedTo: currentUser.id });
    if (currentUser?.name) assignedMatch.push({ assignedToName: { equals: currentUser.name, mode: 'insensitive' } });

    if (assignedMatch.length > 0) {
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: assignedMatch });
    } else {
      if (!where.AND) where.AND = [];
      where.AND.push({ id: '__none__' });
    }
  }

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
export async function getLeadStatsService(currentUser = null) {
  let baseWhere = {};
  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = !currentUser || roleUpper === 'SUPER_ADMIN' || roleUpper.includes('ADMIN');

  if (!isSuperAdmin) {
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          currentUser?.email ? { email: { equals: currentUser.email, mode: 'insensitive' } } : null,
          currentUser?.name ? { name: { equals: currentUser.name, mode: 'insensitive' } } : null,
          currentUser?.id ? { id: currentUser.id } : null,
        ].filter(Boolean),
      },
    });

    const assignedMatch = [];
    if (emp?.id) assignedMatch.push({ assignedTo: emp.id });
    if (emp?.empCode) assignedMatch.push({ assignedTo: emp.empCode });
    if (emp?.name) assignedMatch.push({ assignedToName: { equals: emp.name, mode: 'insensitive' } });
    if (currentUser?.id) assignedMatch.push({ assignedTo: currentUser.id });
    if (currentUser?.name) assignedMatch.push({ assignedToName: { equals: currentUser.name, mode: 'insensitive' } });

    if (assignedMatch.length > 0) {
      baseWhere = { OR: assignedMatch };
    } else {
      baseWhere = { id: '__none__' };
    }
  }

  const [total, newCount, inProgress, won, lost] = await Promise.all([
    prisma.lead.count({ where: baseWhere }),
    prisma.lead.count({ where: { ...baseWhere, status: 'New' } }),
    prisma.lead.count({ where: { ...baseWhere, status: { in: ['In Progress', 'Contacted', 'Qualified', 'Active'] } } }),
    prisma.lead.count({ where: { ...baseWhere, status: { in: ['Won', 'Closed Won', 'Completed', 'Complete'] } } }),
    prisma.lead.count({ where: { ...baseWhere, status: { in: ['Lost', 'Disqualified'] } } }),
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
export async function createLeadService(body, currentUser = null) {
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
    assignedTo = null,
    assignedToName = null,
    createdBy = null,
    createdByName = null,
  } = body;

  if (!name || !name.trim()) {
    const error = new Error('Lead name is mandatory');
    error.status = 400;
    throw error;
  }

  // Resolve assigned employee details if assignedTo provided
  let finalAssignedTo = assignedTo ? String(assignedTo).trim() : null;
  let finalAssignedToName = assignedToName ? String(assignedToName).trim() : null;

  if (finalAssignedTo && (!finalAssignedToName || finalAssignedToName === 'null' || finalAssignedToName === '')) {
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [{ id: finalAssignedTo }, { empCode: finalAssignedTo }],
      },
    });
    if (emp) {
      finalAssignedTo = emp.id;
      finalAssignedToName = emp.name;
    }
  }

  // Resolve creator details
  const finalCreatedBy = createdBy || currentUser?.id || currentUser?.email || 'admin';
  const finalCreatedByName = createdByName || currentUser?.name || 'Super Admin';

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
      assignedTo: finalAssignedTo,
      assignedToName: finalAssignedToName,
      createdBy: finalCreatedBy,
      createdByName: finalCreatedByName,
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
export async function updateLeadService(id, body, currentUser = null) {
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
    assignedTo,
    assignedToName,
    createdBy,
    createdByName,
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
  if (createdBy !== undefined) updateData.createdBy = createdBy;
  if (createdByName !== undefined) updateData.createdByName = createdByName;

  if (assignedTo !== undefined) {
    if (assignedTo && assignedTo !== 'null' && assignedTo !== 'Unassigned') {
      updateData.assignedTo = String(assignedTo).trim();
      let resName = assignedToName ? String(assignedToName).trim() : null;
      if (!resName) {
        const emp = await prisma.employee.findFirst({
          where: { OR: [{ id: updateData.assignedTo }, { empCode: updateData.assignedTo }] },
        });
        if (emp) resName = emp.name;
      }
      updateData.assignedToName = resName;
    } else {
      updateData.assignedTo = null;
      updateData.assignedToName = null;
    }
  } else if (assignedToName !== undefined) {
    updateData.assignedToName = assignedToName ? String(assignedToName).trim() : null;
  }

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
export async function deleteLeadService(id, currentUser = null) {
  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = !currentUser || roleUpper === 'SUPER_ADMIN' || roleUpper.includes('ADMIN');

  if (currentUser && !isSuperAdmin) {
    const error = new Error('Access denied. Only Super Admin can delete leads.');
    error.status = 403;
    throw error;
  }

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

// =============================================================================
// NEGOTIATIONS (Inside Lead Service)
// =============================================================================

/**
 * 13. GET ALL NEGOTIATIONS
 */
export async function getLeadNegotiationsService(queryParams = {}) {
  const {
    search,
    status,
    leadId,
    contactId,
    assignedTo,
    date,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const where = {};

  if (status && status !== 'ALL' && status !== 'All') {
    where.status = { equals: status, mode: 'insensitive' };
  }

  if (leadId && leadId !== 'ALL' && leadId !== 'All') {
    where.leadId = leadId;
  }
  if (contactId && contactId !== 'ALL' && contactId !== 'All') {
    where.contactId = contactId;
  }

  if (assignedTo && assignedTo !== 'ALL' && assignedTo !== 'All') {
    where.OR = [
      { assignedTo },
      { assignedToName: { contains: assignedTo, mode: 'insensitive' } },
    ];
  }

  if (date) {
    where.negotiationDate = date;
  } else if (startDate && endDate) {
    where.negotiationDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  if (search && search.trim()) {
    const q = search.trim();
    const searchConditions = [
      { negotiationId: { contains: q, mode: 'insensitive' } },
      { leadName: { contains: q, mode: 'insensitive' } },
      { clientName: { contains: q, mode: 'insensitive' } },
      { quotationNumber: { contains: q, mode: 'insensitive' } },
      { proposalNumber: { contains: q, mode: 'insensitive' } },
      { assignedToName: { contains: q, mode: 'insensitive' } },
      { paymentTerms: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
      { clientRequirements: { contains: q, mode: 'insensitive' } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * pageSize;

  const validSortFields = [
    'negotiationId',
    'negotiationDate',
    'quotedAmount',
    'expectedFinalAmount',
    'discountPercentage',
    'status',
    'nextFollowUpDate',
    'createdAt',
    'updatedAt',
  ];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [records, total] = await Promise.all([
    prisma.negotiation.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [orderField]: orderDir },
    }),
    prisma.negotiation.count({ where }),
  ]);

  return {
    data: records.map(formatNegotiationResponse),
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}
export const getNegotiationsService = getLeadNegotiationsService;

/**
 * 14. GET NEGOTIATION STATS
 */
export async function getLeadNegotiationStatsService() {
  const [all, inProgress, awaitingClient, revisedQuotation, won, lost] = await Promise.all([
    prisma.negotiation.findMany({
      select: { quotedAmount: true, expectedFinalAmount: true, status: true },
    }),
    prisma.negotiation.count({ where: { status: { equals: 'In Progress', mode: 'insensitive' } } }),
    prisma.negotiation.count({ where: { status: { equals: 'Awaiting Client', mode: 'insensitive' } } }),
    prisma.negotiation.count({ where: { status: { equals: 'Revised Quotation', mode: 'insensitive' } } }),
    prisma.negotiation.count({ where: { status: { equals: 'Won', mode: 'insensitive' } } }),
    prisma.negotiation.count({ where: { status: { equals: 'Lost', mode: 'insensitive' } } }),
  ]);

  const totalQuotedValue = all.reduce((sum, item) => sum + (Number(item.quotedAmount) || 0), 0);
  const totalExpectedValue = all.reduce((sum, item) => sum + (Number(item.expectedFinalAmount) || 0), 0);

  return {
    total: all.length,
    inProgress,
    awaitingClient,
    revisedQuotation,
    won,
    lost,
    totalQuotedValue,
    totalExpectedValue,
  };
}
export const getNegotiationStatsService = getLeadNegotiationStatsService;

/**
 * 15. GET NEGOTIATION BY ID
 */
export async function getLeadNegotiationByIdService(id) {
  const record = await prisma.negotiation.findFirst({
    where: {
      OR: [{ id }, { negotiationId: id }],
    },
  });

  if (!record) {
    const error = new Error('Negotiation record not found');
    error.status = 404;
    throw error;
  }

  return formatNegotiationResponse(record);
}
export const getNegotiationByIdService = getLeadNegotiationByIdService;

/**
 * 16. CREATE NEGOTIATION
 */
export async function createLeadNegotiationService(data, user = {}) {
  const {
    negotiationId,
    leadId,
    leadName,
    clientName,
    contactId,
    quotationId,
    quotationNumber,
    proposalId,
    proposalNumber,
    assignedTo,
    assignedToName,
    negotiationDate,
    status = 'In Progress',
    quotedAmount = 0,
    expectedFinalAmount,
    discountPercentage = 0,
    paymentTerms = 'Milestone Based',
    scopeChanges = '',
    deliveryTimeline = '',
    clientRequirements = '',
    notes = '',
    nextFollowUpDate,
    lossReason = '',
  } = data;

  if (!leadName || !leadName.trim()) {
    const err = new Error('Lead / Client Name is required');
    err.status = 400;
    throw err;
  }

  if (!negotiationDate) {
    const err = new Error('Negotiation Date is required');
    err.status = 400;
    throw err;
  }

  // Conditional follow-up date validation: required when status is "Awaiting Client"
  if (status === 'Awaiting Client' && (!nextFollowUpDate || !nextFollowUpDate.trim())) {
    const err = new Error('Next Follow-up Date is required when status is Awaiting Client');
    err.status = 400;
    throw err;
  }

  const numQuoted = Math.max(0, parseFloat(quotedAmount) || 0);
  let numDiscountPct = Math.max(0, parseFloat(discountPercentage) || 0);
  let numExpected =
    expectedFinalAmount !== undefined && expectedFinalAmount !== null && expectedFinalAmount !== ''
      ? Math.max(0, parseFloat(expectedFinalAmount))
      : null;

  let calcDiscountAmount = 0;
  if (numExpected !== null && numExpected !== undefined && numQuoted > 0) {
    calcDiscountAmount = Math.max(0, numQuoted - numExpected);
    numDiscountPct = Math.round(((numQuoted - numExpected) / numQuoted) * 100);
  } else {
    calcDiscountAmount = (numQuoted * numDiscountPct) / 100;
    numExpected = Math.max(0, numQuoted - calcDiscountAmount);
  }

  const generatedId = await generateNegotiationId(prisma);

  const authorName = user?.name || assignedToName || 'System';
  const initialHistoryEntry = {
    id: `entry-${Date.now()}`,
    date: negotiationDate || new Date().toISOString().split('T')[0],
    author: authorName,
    topic: 'Negotiation Created',
    notes: notes?.trim() || `Negotiation initiated with status "${status}" at ₹${numExpected.toLocaleString('en-IN')}.`,
    status,
    createdAt: new Date().toISOString(),
  };

  const created = await prisma.negotiation.create({
    data: {
      negotiationId: (negotiationId && negotiationId.trim()) || generatedId,
      leadId: leadId || null,
      leadName: leadName.trim(),
      clientName: clientName?.trim() || leadName.trim(),
      contactId: contactId || null,
      quotationId: quotationId || null,
      quotationNumber: quotationNumber?.trim() || null,
      proposalId: proposalId || null,
      proposalNumber: proposalNumber?.trim() || null,
      assignedTo: assignedTo || null,
      assignedToName: assignedToName?.trim() || 'Admin Employee',
      negotiationDate,
      status,
      quotedAmount: numQuoted,
      expectedFinalAmount: numExpected,
      discountPercentage: numDiscountPct,
      discountAmount: calcDiscountAmount,
      paymentTerms: paymentTerms || 'Milestone Based',
      scopeChanges: scopeChanges?.trim() || null,
      deliveryTimeline: deliveryTimeline?.trim() || null,
      clientRequirements: clientRequirements?.trim() || null,
      notes: notes?.trim() || null,
      nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.trim() : null,
      discussionHistory: [initialHistoryEntry],
      lossReason: status === 'Lost' ? lossReason?.trim() || null : null,
    },
  });

  return formatNegotiationResponse(created);
}
export const createNegotiationService = createLeadNegotiationService;

/**
 * 17. UPDATE NEGOTIATION
 */
export async function updateLeadNegotiationService(id, data, user = {}) {
  const existing = await prisma.negotiation.findFirst({
    where: {
      OR: [{ id }, { negotiationId: id }],
    },
  });

  if (!existing) {
    const error = new Error('Negotiation record not found');
    error.status = 404;
    throw error;
  }

  const {
    leadId,
    leadName,
    clientName,
    contactId,
    quotationId,
    quotationNumber,
    proposalId,
    proposalNumber,
    assignedTo,
    assignedToName,
    negotiationDate,
    status,
    quotedAmount,
    expectedFinalAmount,
    discountPercentage,
    paymentTerms,
    scopeChanges,
    deliveryTimeline,
    clientRequirements,
    notes,
    nextFollowUpDate,
    lossReason,
  } = data;

  const targetStatus = status !== undefined ? status : existing.status;

  if (targetStatus === 'Awaiting Client') {
    const checkDate = nextFollowUpDate !== undefined ? nextFollowUpDate : existing.nextFollowUpDate;
    if (!checkDate || !checkDate.trim()) {
      const err = new Error('Next Follow-up Date is required when status is Awaiting Client');
      err.status = 400;
      throw err;
    }
  }

  const numQuoted = quotedAmount !== undefined ? Math.max(0, parseFloat(quotedAmount) || 0) : existing.quotedAmount;
  let numDiscountPct =
    discountPercentage !== undefined
      ? Math.max(0, parseFloat(discountPercentage) || 0)
      : existing.discountPercentage;
  let numExpected =
    expectedFinalAmount !== undefined
      ? Math.max(0, parseFloat(expectedFinalAmount) || 0)
      : existing.expectedFinalAmount;

  let calcDiscountAmount = existing.discountAmount;
  if (expectedFinalAmount !== undefined && numQuoted > 0) {
    calcDiscountAmount = Math.max(0, numQuoted - numExpected);
    numDiscountPct = Math.round(((numQuoted - numExpected) / numQuoted) * 100);
  } else if (discountPercentage !== undefined && numQuoted > 0) {
    calcDiscountAmount = (numQuoted * numDiscountPct) / 100;
    numExpected = Math.max(0, numQuoted - calcDiscountAmount);
  }

  const finalFollowUpDate =
    nextFollowUpDate !== undefined
      ? nextFollowUpDate
        ? nextFollowUpDate.trim()
        : null
      : existing.nextFollowUpDate;

  const existingHistory = Array.isArray(existing.discussionHistory) ? existing.discussionHistory : [];
  let updatedHistory = existingHistory;

  if (notes && notes.trim() !== existing.notes) {
    const authorName = user?.name || assignedToName || existing.assignedToName || 'System';
    const newEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: authorName,
      topic: targetStatus !== existing.status ? `Status changed to ${targetStatus}` : 'Discussion Logged',
      notes: notes.trim(),
      status: targetStatus,
      createdAt: new Date().toISOString(),
    };
    updatedHistory = [newEntry, ...existingHistory];
  }

  const updatePayload = {
    ...(leadId !== undefined && { leadId }),
    ...(leadName !== undefined && { leadName: leadName.trim() }),
    ...(clientName !== undefined && { clientName: clientName.trim() }),
    ...(contactId !== undefined && { contactId }),
    ...(quotationId !== undefined && { quotationId }),
    ...(quotationNumber !== undefined && { quotationNumber: quotationNumber?.trim() || null }),
    ...(proposalId !== undefined && { proposalId }),
    ...(proposalNumber !== undefined && { proposalNumber: proposalNumber?.trim() || null }),
    ...(assignedTo !== undefined && { assignedTo }),
    ...(assignedToName !== undefined && { assignedToName: assignedToName.trim() }),
    ...(negotiationDate !== undefined && { negotiationDate }),
    ...(status !== undefined && { status }),
    quotedAmount: numQuoted,
    expectedFinalAmount: numExpected,
    discountPercentage: numDiscountPct,
    discountAmount: calcDiscountAmount,
    ...(paymentTerms !== undefined && { paymentTerms }),
    ...(scopeChanges !== undefined && { scopeChanges: scopeChanges?.trim() || null }),
    ...(deliveryTimeline !== undefined && { deliveryTimeline: deliveryTimeline?.trim() || null }),
    ...(clientRequirements !== undefined && { clientRequirements: clientRequirements?.trim() || null }),
    ...(notes !== undefined && { notes: notes?.trim() || null }),
    nextFollowUpDate: finalFollowUpDate,
    discussionHistory: updatedHistory,
    ...(lossReason !== undefined && { lossReason: lossReason?.trim() || null }),
  };

  const updated = await prisma.negotiation.update({
    where: { id: existing.id },
    data: updatePayload,
  });

  return formatNegotiationResponse(updated);
}
export const updateNegotiationService = updateLeadNegotiationService;

/**
 * 18. DELETE NEGOTIATION
 */
export async function deleteLeadNegotiationService(id) {
  const existing = await prisma.negotiation.findFirst({
    where: {
      OR: [{ id }, { negotiationId: id }],
    },
  });

  if (!existing) {
    const error = new Error('Negotiation record not found');
    error.status = 404;
    throw error;
  }

  await prisma.negotiation.delete({
    where: { id: existing.id },
  });

  return { id: existing.id, negotiationId: existing.negotiationId };
}
export const deleteNegotiationService = deleteLeadNegotiationService;

/**
 * 19. LIST CONTRACTS (UNDER LEAD MODULE)
 */
export async function getLeadContractsService(queryParams = {}) {
  const {
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = buildContractFilterQuery(queryParams);

  const validSortFields = [
    'createdAt',
    'updatedAt',
    'contractDate',
    'startDate',
    'endDate',
    'contractValue',
    'title',
    'clientName',
    'status',
    'approvalStatus',
    'signatureStatus',
  ];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, records] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      orderBy: { [finalSortBy]: finalSortOrder },
      skip,
      take: limitNum,
    }),
  ]);

  return {
    data: records.map(formatContractResponse),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}
export const getContractsService = getLeadContractsService;

/**
 * 20. GET CONTRACT STATS
 */
export async function getLeadContractStatsService(leadId = null) {
  const where = leadId && leadId !== 'ALL' && leadId !== 'All' ? { leadId } : {};

  const [
    total,
    draft,
    pendingApproval,
    sentForSignature,
    partiallySigned,
    active,
    completed,
    expired,
    terminated,
    contracts,
  ] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.count({ where: { ...where, status: 'Draft' } }),
    prisma.contract.count({ where: { ...where, status: 'Pending Approval' } }),
    prisma.contract.count({ where: { ...where, status: 'Sent for Signature' } }),
    prisma.contract.count({ where: { ...where, status: 'Partially Signed' } }),
    prisma.contract.count({ where: { ...where, status: 'Active' } }),
    prisma.contract.count({ where: { ...where, status: 'Completed' } }),
    prisma.contract.count({ where: { ...where, status: 'Expired' } }),
    prisma.contract.count({ where: { ...where, status: 'Terminated' } }),
    prisma.contract.findMany({
      where,
      select: { contractValue: true },
    }),
  ]);

  const totalContractValue = contracts.reduce((acc, c) => acc + (Number(c.contractValue) || 0), 0);

  return {
    total,
    draft,
    pendingApproval,
    sentForSignature,
    partiallySigned,
    active,
    completed,
    expired,
    terminated,
    totalContractValue,
  };
}
export const getContractStatsService = getLeadContractStatsService;

/**
 * 21. GET CONTRACT BY ID
 */
export async function getLeadContractByIdService(id) {
  const record = await prisma.contract.findFirst({
    where: {
      OR: [{ id }, { contractId: id }],
    },
  });

  if (!record) {
    const error = new Error('Contract record not found');
    error.status = 404;
    throw error;
  }

  return formatContractResponse(record);
}
export const getContractByIdService = getLeadContractByIdService;

/**
 * 22. CREATE CONTRACT
 */
export async function createLeadContractService(data, user = {}) {
  const {
    contractId,
    title,
    contractType = 'Software Development',
    clientName,
    leadId,
    leadName,
    contactId,
    proposalId,
    proposalNumber,
    negotiationId,
    negotiationNumber,
    assignedTo,
    assignedToName,
    contractDate,
    projectName,
    projectDescription,
    scopeOfWork,
    deliverables,
    responsibilities,
    startDate,
    endDate,
    specialConditions,
    contractValue = 0,
    warrantyTerms,
    confidentialityClause,
    terminationClause,
    additionalTerms,
    documentName,
    documentUrl,
    documentSize,
    attachments = [],
    clientSignatoryName,
    companySignatoryName = 'OmniTech Solutions Representative',
    signatureStatus = 'Pending',
    signedDate,
    approvalStatus = 'Draft',
    approvedBy,
    approvalDate,
    status = 'Draft',
  } = data;

  if (!title || !title.trim()) {
    const err = new Error('Contract Title is required');
    err.status = 400;
    throw err;
  }

  if (!contractDate) {
    const err = new Error('Contract Date is required');
    err.status = 400;
    throw err;
  }

  const generatedId = await generateContractId(prisma);
  const numValue = Math.max(0, parseFloat(contractValue) || 0);

  const created = await prisma.contract.create({
    data: {
      contractId: (contractId && contractId.trim()) || generatedId,
      title: title.trim(),
      contractType: contractType || 'Software Development',
      clientName: (clientName && clientName.trim()) || (leadName && leadName.trim()) || 'Client',
      leadId: leadId || null,
      leadName: leadName ? leadName.trim() : null,
      contactId: contactId || null,
      proposalId: proposalId || null,
      proposalNumber: proposalNumber ? proposalNumber.trim() : null,
      negotiationId: negotiationId || null,
      negotiationNumber: negotiationNumber ? negotiationNumber.trim() : null,
      assignedTo: assignedTo || null,
      assignedToName: (assignedToName && assignedToName.trim()) || user?.name || 'Assigned Staff',
      contractDate: contractDate || new Date().toISOString().split('T')[0],
      projectName: projectName ? projectName.trim() : null,
      projectDescription: projectDescription ? projectDescription.trim() : null,
      scopeOfWork: scopeOfWork ? scopeOfWork.trim() : null,
      deliverables: deliverables ? deliverables.trim() : null,
      responsibilities: responsibilities ? responsibilities.trim() : null,
      startDate: startDate || null,
      endDate: endDate || null,
      specialConditions: specialConditions ? specialConditions.trim() : null,
      contractValue: numValue,
      warrantyTerms: warrantyTerms ? warrantyTerms.trim() : null,
      confidentialityClause: confidentialityClause ? confidentialityClause.trim() : null,
      terminationClause: terminationClause ? terminationClause.trim() : null,
      additionalTerms: additionalTerms ? additionalTerms.trim() : null,
      documentName: documentName || null,
      documentUrl: documentUrl || null,
      documentSize: documentSize || null,
      attachments: Array.isArray(attachments) ? attachments : [],
      clientSignatoryName: clientSignatoryName ? clientSignatoryName.trim() : null,
      companySignatoryName: companySignatoryName ? companySignatoryName.trim() : 'OmniTech Solutions Representative',
      signatureStatus: signatureStatus || 'Pending',
      signedDate: signedDate || null,
      approvalStatus: approvalStatus || 'Draft',
      approvedBy: approvedBy ? approvedBy.trim() : null,
      approvalDate: approvalDate || null,
      status: status || 'Draft',
    },
  });

  return formatContractResponse(created);
}
export const createContractService = createLeadContractService;

/**
 * 23. UPDATE CONTRACT
 */
export async function updateLeadContractService(id, data, user = {}) {
  const existing = await prisma.contract.findFirst({
    where: {
      OR: [{ id }, { contractId: id }],
    },
  });

  if (!existing) {
    const error = new Error('Contract record not found');
    error.status = 404;
    throw error;
  }

  const {
    title,
    contractType,
    clientName,
    leadId,
    leadName,
    contactId,
    proposalId,
    proposalNumber,
    negotiationId,
    negotiationNumber,
    assignedTo,
    assignedToName,
    contractDate,
    projectName,
    projectDescription,
    scopeOfWork,
    deliverables,
    responsibilities,
    startDate,
    endDate,
    specialConditions,
    contractValue,
    warrantyTerms,
    confidentialityClause,
    terminationClause,
    additionalTerms,
    documentName,
    documentUrl,
    documentSize,
    attachments,
    clientSignatoryName,
    companySignatoryName,
    signatureStatus,
    signedDate,
    approvalStatus,
    approvedBy,
    approvalDate,
    status,
  } = data;

  const numValue =
    contractValue !== undefined && contractValue !== null && contractValue !== ''
      ? Math.max(0, parseFloat(contractValue))
      : existing.contractValue;

  const updatePayload = {
    ...(title !== undefined && { title: title.trim() }),
    ...(contractType !== undefined && { contractType }),
    ...(clientName !== undefined && { clientName: clientName.trim() }),
    ...(leadId !== undefined && { leadId }),
    ...(leadName !== undefined && { leadName: leadName?.trim() || null }),
    ...(contactId !== undefined && { contactId }),
    ...(proposalId !== undefined && { proposalId }),
    ...(proposalNumber !== undefined && { proposalNumber: proposalNumber?.trim() || null }),
    ...(negotiationId !== undefined && { negotiationId }),
    ...(negotiationNumber !== undefined && { negotiationNumber: negotiationNumber?.trim() || null }),
    ...(assignedTo !== undefined && { assignedTo }),
    ...(assignedToName !== undefined && { assignedToName: assignedToName.trim() }),
    ...(contractDate !== undefined && { contractDate }),
    ...(projectName !== undefined && { projectName: projectName?.trim() || null }),
    ...(projectDescription !== undefined && { projectDescription: projectDescription?.trim() || null }),
    ...(scopeOfWork !== undefined && { scopeOfWork: scopeOfWork?.trim() || null }),
    ...(deliverables !== undefined && { deliverables: deliverables?.trim() || null }),
    ...(responsibilities !== undefined && { responsibilities: responsibilities?.trim() || null }),
    ...(startDate !== undefined && { startDate: startDate || null }),
    ...(endDate !== undefined && { endDate: endDate || null }),
    ...(specialConditions !== undefined && { specialConditions: specialConditions?.trim() || null }),
    contractValue: numValue,
    ...(warrantyTerms !== undefined && { warrantyTerms: warrantyTerms?.trim() || null }),
    ...(confidentialityClause !== undefined && { confidentialityClause: confidentialityClause?.trim() || null }),
    ...(terminationClause !== undefined && { terminationClause: terminationClause?.trim() || null }),
    ...(additionalTerms !== undefined && { additionalTerms: additionalTerms?.trim() || null }),
    ...(documentName !== undefined && { documentName }),
    ...(documentUrl !== undefined && { documentUrl }),
    ...(documentSize !== undefined && { documentSize }),
    ...(attachments !== undefined && { attachments: Array.isArray(attachments) ? attachments : [] }),
    ...(clientSignatoryName !== undefined && { clientSignatoryName: clientSignatoryName?.trim() || null }),
    ...(companySignatoryName !== undefined && { companySignatoryName: companySignatoryName?.trim() || null }),
    ...(signatureStatus !== undefined && { signatureStatus }),
    ...(signedDate !== undefined && { signedDate: signedDate || null }),
    ...(approvalStatus !== undefined && { approvalStatus }),
    ...(approvedBy !== undefined && { approvedBy: approvedBy?.trim() || null }),
    ...(approvalDate !== undefined && { approvalDate: approvalDate || null }),
    ...(status !== undefined && { status }),
  };

  const updated = await prisma.contract.update({
    where: { id: existing.id },
    data: updatePayload,
  });

  return formatContractResponse(updated);
}
export const updateContractService = updateLeadContractService;

/**
 * 24. DELETE CONTRACT
 */
export async function deleteLeadContractService(id) {
  const existing = await prisma.contract.findFirst({
    where: {
      OR: [{ id }, { contractId: id }],
    },
  });

  if (!existing) {
    const error = new Error('Contract record not found');
    error.status = 404;
    throw error;
  }

  await prisma.contract.delete({
    where: { id: existing.id },
  });

  return { id: existing.id, contractId: existing.contractId };
}
export const deleteContractService = deleteLeadContractService;

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
  getLeadNegotiationsService,
  getLeadNegotiationStatsService,
  getLeadNegotiationByIdService,
  createLeadNegotiationService,
  updateLeadNegotiationService,
  deleteLeadNegotiationService,
  getNegotiationsService,
  getNegotiationStatsService,
  getNegotiationByIdService,
  createNegotiationService,
  updateNegotiationService,
  deleteNegotiationService,
  getLeadContractsService,
  getLeadContractStatsService,
  getLeadContractByIdService,
  createLeadContractService,
  updateLeadContractService,
  deleteLeadContractService,
  getContractsService,
  getContractStatsService,
  getContractByIdService,
  createContractService,
  updateContractService,
  deleteContractService,
};


