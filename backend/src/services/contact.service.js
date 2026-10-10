import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { delCache } from '../config/redis.js';
import { io } from '../utils/socket.js';
import { logAuditEvent } from './auditService.js';
import { CONTACT_MODULE } from '../modules/contact.module.js';
import { generateContactId, buildContactFilterQuery, formatContactResponse } from '../utils/contact.util.js';

/**
 * 1. List contacts with search, filters, pagination, and sorting
 */
export async function getContactsService(queryParams = {}) {
  const {
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = buildContactFilterQuery(queryParams);

  const validSortFields = ['createdAt', 'updatedAt', 'name', 'companyName', 'status', 'stage'];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, contacts] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { [finalSortBy]: finalSortOrder },
      skip,
      take: limitNum,
    }),
  ]);

  return {
    data: contacts.map(formatContactResponse),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * 2. Get Single Contact by ID
 */
export async function getContactByIdService(id) {
  const contact = await prisma.contact.findFirst({
    where: {
      OR: [{ id }, { contactId: id }, { uuid: id }],
    },
  });

  if (!contact) {
    const error = new Error('Contact not found');
    error.status = 404;
    throw error;
  }

  return { data: formatContactResponse(contact) };
}

/**
 * 3. Get Contact KPI Stats
 */
export async function getContactStatsService() {
  const [total, assigned, qualified, won, unassigned, active, disqualified, highPriority] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({
      where: {
        assignmentStatus: 'Assigned',
        assignedTo: { not: null },
      },
    }),
    prisma.contact.count({ where: { stage: 'Qualification' } }),
    prisma.contact.count({ where: { stage: { in: ['Won', 'Closed Won'] } } }),
    prisma.contact.count({
      where: {
        OR: [
          { assignmentStatus: 'Unassigned' },
          { assignmentStatus: null },
          { assignedTo: null },
        ],
      },
    }),
    prisma.contact.count({ where: { status: 'Active' } }),
    prisma.contact.count({ where: { qualificationStatus: 'Disqualified' } }),
    prisma.contact.count({ where: { priority: 'High' } }),
  ]);

  return {
    stats: {
      total,
      assigned,
      qualified,
      won,
      unassigned,
      new: unassigned,
      active,
      disqualified,
      highPriority,
    },
  };
}

/**
 * 4. Get Contact Dropdown Metadata
 */
export async function getContactMetadataService() {
  const [employees, companies] = await Promise.all([
    prisma.employee.findMany({
      select: { id: true, name: true, empCode: true, department: true, designation: true },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
    }).catch(() => []),
  ]);

  const metadata = {
    employees,
    companies,
    stages: CONTACT_MODULE.stages,
    statuses: CONTACT_MODULE.statuses,
    sources: CONTACT_MODULE.sources,
    contactTypes: CONTACT_MODULE.contactTypes,
    categories: CONTACT_MODULE.categories,
    productOptions: CONTACT_MODULE.productOptions,
    serviceOptions: CONTACT_MODULE.serviceOptions,
    priorities: CONTACT_MODULE.priorities,
    qualificationStatuses: CONTACT_MODULE.qualificationStatuses,
  };

  return { data: metadata, metadata };
}

/**
 * 5. Create Contact
 */
export async function createContactService(body, user) {
  const {
    name,
    email,
    phone,
    mobile_number,
    address,
    source = 'Website',
    customSource,
    contactType = 'Company Representative',
    companyName,
    designation,
    profession,
    annualRevenue,
    category = 'Product',
    productList = [],
    serviceList = [],
    customProduct,
    contactMode = 'Call',
    customContactMode,
    meetingType = 'Virtual',
    nextFollowDate,
    remarks,
    notes,
    status = 'New',
    stage = 'New Lead',
    qualificationStatus = 'In Progress',
    priority = 'Medium',
    assignedTo,
  } = body;

  if (!name || !name.trim()) {
    const error = new Error('Contact name is required.');
    error.status = 400;
    throw error;
  }

  const finalPhone = phone || mobile_number;
  if (!finalPhone || !String(finalPhone).trim()) {
    const error = new Error('Phone number is required.');
    error.status = 400;
    throw error;
  }

  const count = await prisma.contact.count();
  const contactId = generateContactId(count);

  let assignedToName = null;
  let assignmentStatus = 'Unassigned';
  if (assignedTo && assignedTo !== 'none') {
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: assignedTo }, { empCode: assignedTo }] },
    });
    if (emp) {
      assignedToName = emp.name;
      assignmentStatus = 'Assigned';
    }
  }

  const newContact = await prisma.contact.create({
    data: {
      contactId,
      uuid: crypto.randomUUID(),
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: String(finalPhone).trim(),
      address: address || null,
      source: source || 'Website',
      customSource: customSource || null,
      contactType,
      companyName: companyName ? companyName.trim() : null,
      designation: designation || null,
      profession: profession || null,
      annualRevenue: annualRevenue || null,
      category,
      productList: Array.isArray(productList) ? productList : [],
      serviceList: Array.isArray(serviceList) ? serviceList : [],
      customProduct: customProduct || null,
      contactMode,
      customContactMode: customContactMode || null,
      meetingType,
      nextFollowDate: nextFollowDate || null,
      remarks: remarks || null,
      notes: notes || null,
      status: status || 'New',
      stage: stage || 'Initialization',
      qualificationStatus: qualificationStatus || 'In Progress',
      priority: priority || 'Medium',
      assignedTo: assignedTo && assignedTo !== 'none' ? assignedTo : null,
      assignedToName,
      assignmentStatus,
      assignedAt: assignedToName ? new Date() : null,
      createdBy: user?.name || 'System Admin',
    },
  });

  await delCache('crm:contacts:*');

  if (io) {
    io.emit('contact_created', newContact);
  }

  return {
    message: `Contact '${newContact.name}' created successfully!`,
    data: formatContactResponse(newContact),
  };
}

/**
 * 6. Update Contact
 */
export async function updateContactService(id, body, user) {
  const existing = await prisma.contact.findFirst({
    where: { OR: [{ id }, { contactId: id }, { uuid: id }] },
  });

  if (!existing) {
    const error = new Error('Contact not found');
    error.status = 404;
    throw error;
  }

  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.email !== undefined && { email: body.email ? body.email.toLowerCase().trim() : null }),
      ...(body.phone && { phone: String(body.phone).trim() }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.source !== undefined && { source: body.source }),
      ...(body.customSource !== undefined && { customSource: body.customSource }),
      ...(body.contactType !== undefined && { contactType: body.contactType }),
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.profession !== undefined && { profession: body.profession }),
      ...(body.designation !== undefined && { designation: body.designation }),
      ...(body.annualRevenue !== undefined && { annualRevenue: body.annualRevenue }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.productList !== undefined && { productList: body.productList }),
      ...(body.serviceList !== undefined && { serviceList: body.serviceList }),
      ...(body.customProduct !== undefined && { customProduct: body.customProduct }),
      ...(body.contactMode !== undefined && { contactMode: body.contactMode }),
      ...(body.customContactMode !== undefined && { customContactMode: body.customContactMode }),
      ...(body.meetingType !== undefined && { meetingType: body.meetingType }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.qualificationStatus !== undefined && { qualificationStatus: body.qualificationStatus }),
      ...(body.qualifiedBy !== undefined && { qualifiedBy: body.qualifiedBy }),
      ...(body.qualificationDate !== undefined && { qualificationDate: body.qualificationDate }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.remarks !== undefined && { remarks: body.remarks }),
      ...(body.nextFollowDate !== undefined && { nextFollowDate: body.nextFollowDate }),
      ...(body.assignedTo !== undefined && {
        assignedTo: body.assignedTo && body.assignedTo !== 'none' && body.assignedTo !== 'Unassigned' ? body.assignedTo : null,
        assignmentStatus: body.assignedTo && body.assignedTo !== 'none' && body.assignedTo !== 'Unassigned' ? 'Assigned' : 'Unassigned',
      }),
    },
  });

  await delCache('crm:contacts:*');

  if (io) {
    io.emit('contact_updated', updated);
  }

  return {
    message: 'Contact updated successfully',
    data: formatContactResponse(updated),
  };
}

/**
 * 7. Assign Contact
 */
export async function assignContactService(id, body, user) {
  const { employeeId, assignedTo } = body;
  const targetEmpId = employeeId !== undefined ? employeeId : assignedTo;

  const existing = await prisma.contact.findFirst({
    where: { OR: [{ id }, { contactId: id }, { uuid: id }] },
  });

  if (!existing) {
    const error = new Error('Contact not found');
    error.status = 404;
    throw error;
  }

  let assignedToName = null;
  let assignmentStatus = 'Unassigned';
  let assignedAt = null;

  if (targetEmpId && targetEmpId !== 'Unassigned' && targetEmpId !== 'none') {
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: targetEmpId }, { empCode: targetEmpId }] },
    });
    if (emp) {
      assignedToName = emp.name;
      assignmentStatus = 'Assigned';
      assignedAt = new Date();
    }
  }

  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data: {
      assignedTo: targetEmpId && targetEmpId !== 'Unassigned' && targetEmpId !== 'none' ? targetEmpId : null,
      assignedToName,
      assignmentStatus,
      assignedAt,
      assignedBy: user?.name || 'System Admin',
    },
  });

  await delCache('crm:contacts:*');

  if (io) {
    io.emit('contact_assigned', updated);
  }

  return {
    message: 'Contact assignment updated successfully',
    data: formatContactResponse(updated),
  };
}

/**
 * 8. Delete Contact
 */
export async function deleteContactService(id, user) {
  const contact = await prisma.contact.findFirst({
    where: { OR: [{ id }, { contactId: id }] },
  });

  if (!contact) {
    const error = new Error('Contact not found');
    error.status = 404;
    throw error;
  }

  await prisma.contact.delete({ where: { id: contact.id } });
  await delCache('crm:contacts:*');

  if (io) {
    io.emit('contact_deleted', { id: contact.id });
  }

  return {
    message: 'Contact deleted successfully',
  };
}

export default {
  getContactsService,
  getContactByIdService,
  getContactStatsService,
  getContactMetadataService,
  createContactService,
  updateContactService,
  assignContactService,
  deleteContactService,
};
