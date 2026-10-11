import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { delCache } from '../config/redis.js';
import { io } from '../utils/socket.js';
import { logAuditEvent } from './auditService.js';
import { CONTACT_MODULE } from '../models/contact.model.js';
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
      OR: [{ id }, { contactId: id }],
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
  const [total, assigned, qualified, won, unassigned, active, disqualified, highPriority, newCount] = await Promise.all([
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
          { assignedTo: '' },
          { assignedTo: 'none' },
        ],
      },
    }),
    prisma.contact.count({ where: { status: 'Active' } }),
    prisma.contact.count({ where: { qualificationStatus: 'Disqualified' } }),
    prisma.contact.count({ where: { priority: 'High' } }),
    prisma.contact.count({
      where: {
        OR: [
          { assignmentStatus: 'Unassigned' },
          { assignmentStatus: null },
          { assignedTo: null },
          { assignedTo: '' },
          { assignedTo: 'none' },
        ],
      },
    }),
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
  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, empCode: true, department: true, designation: true },
  });

  const metadata = {
    employees,
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
    category = 'Product',
    productList = [],
    serviceList = [],
    customProduct,
    nextFollowDate,
    remarks,
    notes,
    status = 'New',
    stage = 'Initialization',
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
  const phoneDigits = String(finalPhone || '').replace(/\D/g, '');
  if (!phoneDigits) {
    const error = new Error('Phone number is required.');
    error.status = 400;
    throw error;
  }
  if (phoneDigits.length !== 10) {
    const error = new Error('Mobile number must be exactly 10 digits.');
    error.status = 400;
    throw error;
  }

  const count = await prisma.contact.count();
  const contactId = generateContactId(count);

  let assignedToName = null;
  let assignmentStatus = 'Unassigned';
  if (assignedTo && assignedTo !== 'none' && assignedTo !== 'Unassigned' && assignedTo !== 'null' && String(assignedTo).trim() !== '') {
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
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: phoneDigits,
      address: address || null,
      source: source || 'Website',
      customSource: customSource || null,
      contactType,
      companyName: companyName ? companyName.trim() : null,
      designation: designation || null,
      profession: profession || null,
      category,
      productList: Array.isArray(productList) ? productList : [],
      serviceList: Array.isArray(serviceList) ? serviceList : [],
      customProduct: customProduct || null,
      nextFollowDate: nextFollowDate || null,
      remarks: remarks || null,
      notes: notes || null,
      status: status || 'New',
      stage: stage || 'Initialization',
      qualificationStatus: qualificationStatus || 'In Progress',
      priority: priority || 'Medium',
      assignedTo: assignedToName ? assignedTo : null,
      assignedToName,
      assignmentStatus,
    },
  });

  await delCache('crm:contacts:*');

  if (io) {
    io.emit('contact_created', newContact);
  }

  // Automatically sync to Lead if contact is Qualified
  await syncContactToLead(newContact);

  return {
    message: `Contact '${newContact.name}' created successfully!`,
    data: formatContactResponse(newContact),
  };
}

/**
 * Safely generate the next Lead ID without collision
 */
async function getNextLeadId() {
  const allLeads = await prisma.lead.findMany({
    select: { leadId: true },
  });
  let maxNum = 1000;
  for (const l of allLeads) {
    if (l.leadId && l.leadId.startsWith('LED-')) {
      const num = parseInt(l.leadId.replace('LED-', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `LED-${maxNum + 1}`;
}

/**
 * Automatically sync/create a Lead when a Contact is qualified
 */
export async function syncContactToLead(contact) {
  if (!contact) return null;

  const isQualified =
    (contact.status && contact.status.toLowerCase() === 'qualified') ||
    (contact.qualificationStatus && contact.qualificationStatus.toLowerCase() === 'qualified');

  if (!isQualified) return null;

  try {
    let existingLead = null;

    // 1. Check by email
    if (contact.email && contact.email.trim()) {
      existingLead = await prisma.lead.findFirst({
        where: { email: { equals: contact.email.trim(), mode: 'insensitive' } },
      });
    }

    // 2. Check by phone
    if (!existingLead && contact.phone && contact.phone.trim()) {
      const cleanPhone = contact.phone.replace(/\D/g, '');
      if (cleanPhone) {
        const leadsWithPhone = await prisma.lead.findMany({
          where: { phone: { not: null } },
        });
        existingLead = leadsWithPhone.find(
          (l) => l.phone && l.phone.replace(/\D/g, '') === cleanPhone
        );
      }
    }

    // 3. Check by name & companyName
    if (!existingLead && contact.name) {
      existingLead = await prisma.lead.findFirst({
        where: {
          name: { equals: contact.name.trim(), mode: 'insensitive' },
          ...(contact.companyName ? { companyName: { equals: contact.companyName.trim(), mode: 'insensitive' } } : {}),
        },
      });
    }

    const category = contact.category || 'Product';
    const productList = Array.isArray(contact.productList) ? contact.productList : [];
    const serviceList = Array.isArray(contact.serviceList) ? contact.serviceList : [];

    if (existingLead) {
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: contact.name ? contact.name.trim() : existingLead.name,
          email: contact.email ? contact.email.trim() : existingLead.email,
          phone: contact.phone ? contact.phone.trim() : existingLead.phone,
          contactType: contact.contactType || existingLead.contactType || 'Company Representative',
          profession: contact.profession || existingLead.profession,
          companyName: contact.companyName || existingLead.companyName,
          designation: contact.designation || existingLead.designation,
          address: contact.address || existingLead.address,
          source: contact.source || existingLead.source || 'Website',
          customSource: contact.customSource || existingLead.customSource,
          category,
          productList: productList.length > 0 ? productList : existingLead.productList,
          serviceList: serviceList.length > 0 ? serviceList : existingLead.serviceList,
          status: 'New',
          stage: 'Initialization',
          createdAt: new Date(),
        },
      });

      await delCache('crm:leads:*').catch(() => {});
      if (io) {
        io.emit('lead_updated', updatedLead);
      }
      return updatedLead;
    } else {
      const leadId = await getNextLeadId();
      const newLead = await prisma.lead.create({
        data: {
          leadId,
          name: contact.name.trim(),
          email: contact.email ? contact.email.trim() : null,
          phone: contact.phone ? contact.phone.trim() : null,
          contactType: contact.contactType || 'Company Representative',
          profession: contact.profession || null,
          companyName: contact.companyName || null,
          designation: contact.designation || null,
          address: contact.address || null,
          source: contact.source || 'Website',
          customSource: contact.customSource || null,
          category,
          productList,
          serviceList,
          status: 'New',
          stage: 'Initialization',
        },
      });

      await delCache('crm:leads:*').catch(() => {});
      if (io) {
        io.emit('lead_created', newLead);
      }
      return newLead;
    }
  } catch (err) {
    console.error('[syncContactToLead Error]:', err);
    return null;
  }
}

/**
 * 6. Update Contact
 */
export async function updateContactService(id, body, user) {
  const existing = await prisma.contact.findFirst({
    where: { OR: [{ id }, { contactId: id }] },
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
      ...(body.phone !== undefined && {
        phone: (() => {
          const digits = String(body.phone || '').replace(/\D/g, '');
          if (digits && digits.length !== 10) {
            const error = new Error('Mobile number must be exactly 10 digits.');
            error.status = 400;
            throw error;
          }
          return digits || String(body.phone).trim();
        })(),
      }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.source !== undefined && { source: body.source }),
      ...(body.customSource !== undefined && { customSource: body.customSource }),
      ...(body.contactType !== undefined && { contactType: body.contactType }),
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.profession !== undefined && { profession: body.profession }),
      ...(body.designation !== undefined && { designation: body.designation }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.productList !== undefined && { productList: body.productList }),
      ...(body.serviceList !== undefined && { serviceList: body.serviceList }),
      ...(body.customProduct !== undefined && { customProduct: body.customProduct }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.qualificationStatus !== undefined && { qualificationStatus: body.qualificationStatus }),
      ...(body.qualifiedBy !== undefined && { qualifiedBy: body.qualifiedBy }),
      ...(body.qualificationDate !== undefined && { qualificationDate: body.qualificationDate }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.disqualificationReason !== undefined && { disqualificationReason: body.disqualificationReason }),
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

  // Automatically sync to Lead if contact is Qualified
  await syncContactToLead(updated);

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
    where: { OR: [{ id }, { contactId: id }] },
  });

  if (!existing) {
    const error = new Error('Contact not found');
    error.status = 404;
    throw error;
  }

  let assignedToName = null;
  let assignmentStatus = 'Unassigned';

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
