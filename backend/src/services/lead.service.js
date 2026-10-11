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
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
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
    prisma.lead.count({ where: { status: { in: ['Won', 'Closed Won'] } } }),
    prisma.lead.count({ where: { status: { in: ['Lost', 'Disqualified'] } } }),
  ]);

  return {
    stats: {
      total,
      new: newCount,
      inProgress,
      won,
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

export default {
  getLeadsService,
  getLeadByIdService,
  getLeadStatsService,
  getLeadMetadataService,
  createLeadService,
  updateLeadService,
  deleteLeadService,
};
