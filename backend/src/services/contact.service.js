import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { delCache } from '../config/redis.js';
import { io } from '../utils/socket.js';
import { logAuditEvent } from './auditService.js';
import { ContactModel, CONTACT_MODULE } from '../models/contact.model.js';
import { generateContactId, buildContactFilterQuery, formatContactResponse } from '../utils/contact.util.js';

/**
 * Helper: check if a user has full enterprise admin privileges or is an employee
 */
async function resolveEmployeeScopedFilter(currentUser) {
  if (!currentUser) return null;
  const roleUpper = String(currentUser.role || '').toUpperCase();
  if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN') {
    return null; // Full super admin access
  }

  if (currentUser.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { roleRelation: true },
    });
    if (dbUser?.roleRelation) {
      const slug = dbUser.roleRelation.slug?.toLowerCase();
      if (slug === 'super_admin') {
        return null;
      }
    }
  }

  // Look up employee record matching current user
  const emp = await prisma.employee.findFirst({
    where: {
      OR: [
        ...(currentUser.email ? [{ email: { equals: currentUser.email, mode: 'insensitive' } }] : []),
        ...(currentUser.name ? [{ name: { equals: currentUser.name, mode: 'insensitive' } }] : []),
      ],
    },
  });

  const assignedOr = [];
  if (emp?.id) assignedOr.push({ assignedTo: emp.id });
  if (emp?.empCode) assignedOr.push({ assignedTo: emp.empCode });
  if (currentUser.id) assignedOr.push({ assignedTo: currentUser.id });
  if (currentUser.name) assignedOr.push({ assignedToName: { equals: currentUser.name, mode: 'insensitive' } });
  if (emp?.name && emp.name !== currentUser.name) assignedOr.push({ assignedToName: { equals: emp.name, mode: 'insensitive' } });

  const createdOr = [];
  if (currentUser.name) createdOr.push({ createdBy: { equals: currentUser.name, mode: 'insensitive' } });
  if (currentUser.email) createdOr.push({ createdBy: { equals: currentUser.email, mode: 'insensitive' } });
  if (currentUser.id) createdOr.push({ createdBy: currentUser.id });
  if (emp?.id && emp.id !== currentUser.id) createdOr.push({ createdBy: emp.id });
  if (emp?.name && emp.name !== currentUser.name) createdOr.push({ createdBy: { equals: emp.name, mode: 'insensitive' } });

  const assignedFilter = assignedOr.length > 0 ? { OR: assignedOr } : { assignedTo: currentUser.id };
  const createdFilter = createdOr.length > 0 ? { OR: createdOr } : { createdBy: currentUser.id };
  const combinedFilter = {
    OR: [
      ...(assignedOr.length > 0 ? assignedOr : [{ assignedTo: currentUser.id }]),
      ...(createdOr.length > 0 ? createdOr : [{ createdBy: currentUser.id }]),
    ],
  };

  return { assignedFilter, createdFilter, combinedFilter };
}

/**
 * 1. List contacts with search, filters, pagination, sorting, and role-based data scoping
 */
export async function getContactsService(queryParams = {}, currentUser = null) {
  const {
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = buildContactFilterQuery(queryParams);

  const empScope = await resolveEmployeeScopedFilter(currentUser);
  if (empScope) {
    where.AND = where.AND || [];
    if (queryParams.assignmentStatus === 'Assigned') {
      where.AND.push(empScope.assignedFilter);
    } else if (queryParams.assignmentStatus === 'Unassigned') {
      // In New / Unassigned tab, employee only sees unassigned contacts created by them
      where.AND.push(empScope.createdFilter);
    } else {
      // General view / All: employee sees contacts assigned to them OR created by them
      where.AND.push(empScope.combinedFilter);
    }
  }

  const validSortFields = ['createdAt', 'updatedAt', 'name', 'companyName', 'status', 'stage'];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
  const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const orderBy = [
    { [finalSortBy]: finalSortOrder },
  ];
  if (finalSortBy !== 'createdAt') {
    orderBy.push({ createdAt: 'desc' });
  }

  const [total, contacts] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy,
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
 * 3. Get Contact KPI Stats (Role-Scoped)
 */
export async function getContactStatsService(currentUser = null) {
  const empScope = await resolveEmployeeScopedFilter(currentUser);

  const assignedWhere = empScope
    ? { assignmentStatus: 'Assigned', AND: [empScope.assignedFilter] }
    : {
        assignmentStatus: 'Assigned',
        assignedTo: { not: null },
      };

  const unassignedWhere = empScope
    ? {
        AND: [
          {
            OR: [
              { assignmentStatus: 'Unassigned' },
              { assignmentStatus: null },
              { assignedTo: null },
              { assignedTo: '' },
              { assignedTo: 'none' },
            ],
          },
          empScope.createdFilter,
        ],
      }
    : {
        OR: [
          { assignmentStatus: 'Unassigned' },
          { assignmentStatus: null },
          { assignedTo: null },
          { assignedTo: '' },
          { assignedTo: 'none' },
        ],
      };

  const totalWhere = empScope ? empScope.combinedFilter : {};

  const [total, assigned, qualified, won, unassigned, active, disqualified, highPriority] = await Promise.all([
    prisma.contact.count({ where: totalWhere }),
    prisma.contact.count({ where: assignedWhere }),
    prisma.contact.count({ where: { stage: 'Qualification', ...(empScope ? { AND: [empScope.combinedFilter] } : {}) } }),
    prisma.contact.count({ where: { stage: { in: ['Won', 'Closed Won'] }, ...(empScope ? { AND: [empScope.combinedFilter] } : {}) } }),
    prisma.contact.count({ where: unassignedWhere }),
    prisma.contact.count({
      where: {
        OR: [
          { qualificationStatus: { in: ['Disqualified', 'Unqualified'] } },
          { status: { in: ['Disqualified', 'Unqualified'] } },
        ],
        ...(empScope ? { AND: [empScope.combinedFilter] } : {}),
      },
    }),
    prisma.contact.count({ where: { priority: 'High', ...(empScope ? { AND: [empScope.combinedFilter] } : {}) } }),
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

  const dynamicMeta = await ContactModel.getDynamicMetadata();

  const metadata = {
    employees,
    ...dynamicMeta,
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
    gstNumber,
    employeeCount,
    companyPan,
    cinNumber,
    companyWebsite,
    linkedinUrl,
    annualTurnover,
    verificationStatus = 'Unverified',
    registeredState,
    nextFollowDate,
    remarks,
    status = 'New',
    stage = 'Initialization',
    qualificationStatus = 'New',
    priority = 'Medium',
    assignedTo,
  } = body;

  if (!name || !name.trim()) {
    const error = new Error('Contact name is required.');
    error.status = 400;
    throw error;
  }

  const finalPhone = phone || mobile_number || '';
  const phoneDigits = String(finalPhone || '').replace(/\D/g, '');
  if (!phoneDigits) {
    const error = new Error('Phone number is required.');
    error.status = 400;
    throw error;
  }
  if (phoneDigits.length !== 10) {
    const error = new Error('Phone number must be exactly 10 digits.');
    error.status = 400;
    throw error;
  }

  const contactId = await getNextContactId();

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
      contactPerson: body.contactPerson ? body.contactPerson.trim() : null,
      estimatedValue: body.estimatedValue || null,
      expectedCloseDate: body.expectedCloseDate || null,
      description: body.description || body.notes || null,
      designation: designation || null,
      profession: profession || null,
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : null,
      employeeCount: employeeCount || null,
      companyPan: companyPan ? companyPan.trim().toUpperCase() : null,
      cinNumber: cinNumber ? cinNumber.trim().toUpperCase() : null,
      companyWebsite: companyWebsite ? companyWebsite.trim() : null,
      linkedinUrl: linkedinUrl ? linkedinUrl.trim() : null,
      annualTurnover: annualTurnover || null,
      verificationStatus: verificationStatus || 'Unverified',
      registeredState: registeredState || null,
      category,
      productList: Array.isArray(productList) ? productList : [],
      serviceList: Array.isArray(serviceList) ? serviceList : [],
      customProduct: customProduct || null,
      nextFollowDate: nextFollowDate || null,
      remarks: remarks || null,
      status: status || 'New',
      stage: stage || 'Initialization',
      qualificationStatus: qualificationStatus || 'New',
      priority: priority || 'Medium',
      businessNeed: body.businessNeed || null,
      budgetRange: body.budgetRange || null,
      decisionMaker: body.decisionMaker || null,
      purchaseTimeline: body.purchaseTimeline || null,
      interestedService: body.interestedService || null,
      qualifiedBy: body.qualifiedBy || null,
      qualificationDate: body.qualificationDate || null,
      unqualifiedReason: body.unqualifiedReason || body.disqualificationReason || null,
      disqualificationReason: body.unqualifiedReason || body.disqualificationReason || null,
      assignedTo: assignedToName ? assignedTo : null,
      assignedToName,
      assignmentStatus,
      createdBy: user?.name || user?.email || user?.id || body.createdBy || null,
      // Verified Odoo Contact Fields
      title: body.title || null,
      mobile: body.mobile || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      street: body.street || null,
      street2: body.street2 || null,
      city: body.city || null,
      zip: body.zip || null,
      country: body.country || 'India',
      paymentTerms: body.paymentTerms || 'Immediate Payment',
      creditLimit: body.creditLimit || null,
      internalReference: body.internalReference || null,
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
 * Safely generate the next Contact ID without collision
 */
export async function getNextContactId() {
  const allContacts = await prisma.contact.findMany({
    select: { contactId: true },
  });
  let maxNum = 1000;
  for (const c of allContacts) {
    if (c.contactId) {
      const match = c.contactId.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  let candidateId = `CNT-${maxNum + 1}`;
  while (await prisma.contact.findUnique({ where: { contactId: candidateId } })) {
    maxNum++;
    candidateId = `CNT-${maxNum + 1}`;
  }
  return candidateId;
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
    const assignedTo = contact.assignedTo || user?.id || null;
    const assignedToName = contact.assignedToName || user?.name || null;
    const createdBy = contact.createdBy || user?.name || user?.email || null;
    const createdByName = contact.createdBy || user?.name || null;

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
          assignedTo: contact.assignedTo || existingLead.assignedTo || assignedTo,
          assignedToName: contact.assignedToName || existingLead.assignedToName || assignedToName,
          createdBy: existingLead.createdBy || createdBy,
          createdByName: existingLead.createdByName || createdByName,
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
          assignedTo,
          assignedToName,
          createdBy,
          createdByName,
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
      ...(body.gstNumber !== undefined && { gstNumber: body.gstNumber ? body.gstNumber.trim().toUpperCase() : null }),
      ...(body.employeeCount !== undefined && { employeeCount: body.employeeCount }),
      ...(body.companyPan !== undefined && { companyPan: body.companyPan ? body.companyPan.trim().toUpperCase() : null }),
      ...(body.cinNumber !== undefined && { cinNumber: body.cinNumber ? body.cinNumber.trim().toUpperCase() : null }),
      ...(body.companyWebsite !== undefined && { companyWebsite: body.companyWebsite ? body.companyWebsite.trim() : null }),
      ...(body.linkedinUrl !== undefined && { linkedinUrl: body.linkedinUrl ? body.linkedinUrl.trim() : null }),
      ...(body.annualTurnover !== undefined && { annualTurnover: body.annualTurnover }),
      ...(body.verificationStatus !== undefined && { verificationStatus: body.verificationStatus }),
      ...(body.registeredState !== undefined && { registeredState: body.registeredState }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.productList !== undefined && { productList: body.productList }),
      ...(body.serviceList !== undefined && { serviceList: body.serviceList }),
      ...(body.customProduct !== undefined && { customProduct: body.customProduct }),
      ...(body.productCode !== undefined && { internalReference: body.productCode, customProduct: body.productCode }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.qualificationStatus !== undefined
        ? {
            qualificationStatus: body.qualificationStatus,
            status:
              body.status !== undefined
                ? body.status
                : body.qualificationStatus === 'Qualified'
                ? 'Qualified'
                : body.qualificationStatus === 'Unqualified' || body.qualificationStatus === 'Disqualified'
                ? 'Disqualified'
                : body.qualificationStatus === 'Follow-up Required'
                ? 'Follow-up Required'
                : body.qualificationStatus === 'Pending'
                ? 'Pending'
                : body.qualificationStatus === 'New'
                ? 'New'
                : 'In Progress',
          }
        : body.status !== undefined
        ? {
            status: body.status,
            qualificationStatus:
              body.status === 'Qualified'
                ? 'Qualified'
                : body.status === 'Disqualified'
                ? 'Unqualified'
                : body.status === 'Follow-up Required'
                ? 'Follow-up Required'
                : body.status === 'New'
                ? 'New'
                : 'Pending',
          }
        : {}),
      ...(body.businessNeed !== undefined && { businessNeed: body.businessNeed }),
      ...(body.budgetRange !== undefined && { budgetRange: body.budgetRange }),
      ...(body.decisionMaker !== undefined && { decisionMaker: body.decisionMaker }),
      ...(body.purchaseTimeline !== undefined && { purchaseTimeline: body.purchaseTimeline }),
      ...(body.interestedService !== undefined && {
        interestedService: body.interestedService,
        ...((body.category === 'Service' || (!body.category && existing.category === 'Service')) && body.interestedService
          ? { serviceList: [body.interestedService] }
          : {}),
        ...((body.category === 'Product' || (!body.category && existing.category === 'Product')) && body.interestedService
          ? { productList: [body.interestedService] }
          : {})
      }),
      ...(body.unqualifiedReason !== undefined && {
        unqualifiedReason: body.unqualifiedReason,
        disqualificationReason: body.unqualifiedReason,
      }),
      ...(body.qualifiedBy !== undefined && { qualifiedBy: body.qualifiedBy }),
      ...(body.qualificationDate !== undefined && { qualificationDate: body.qualificationDate }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.disqualificationReason !== undefined && { disqualificationReason: body.disqualificationReason }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.remarks !== undefined && { remarks: body.remarks }),
      ...(body.nextFollowDate !== undefined && { nextFollowDate: body.nextFollowDate }),
      ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson }),
      ...(body.estimatedValue !== undefined && { estimatedValue: body.estimatedValue }),
      ...(body.expectedCloseDate !== undefined && { expectedCloseDate: body.expectedCloseDate }),
      ...(body.description !== undefined && { description: body.description, notes: body.description }),
      ...(body.assignedTo !== undefined && {
        assignedTo: body.assignedTo && body.assignedTo !== 'none' && body.assignedTo !== 'Unassigned' ? body.assignedTo : null,
        assignmentStatus: body.assignedTo && body.assignedTo !== 'none' && body.assignedTo !== 'Unassigned' ? 'Assigned' : 'Unassigned',
      }),
      // Verified Odoo Contact Fields
      ...(body.title !== undefined && { title: body.title }),
      ...(body.mobile !== undefined && { mobile: body.mobile }),
      ...(body.tags !== undefined && { tags: Array.isArray(body.tags) ? body.tags : [] }),
      ...(body.street !== undefined && { street: body.street }),
      ...(body.street2 !== undefined && { street2: body.street2 }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.zip !== undefined && { zip: body.zip }),
      ...(body.country !== undefined && { country: body.country }),
      ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms }),
      ...(body.creditLimit !== undefined && { creditLimit: body.creditLimit }),
      ...(body.internalReference !== undefined && { internalReference: body.internalReference }),
    },
  });

  await delCache('crm:contacts:*');

  if (io) {
    io.emit('contact_updated', updated);
  }

  // Automatically sync to Lead if contact is Qualified
  await syncContactToLead(updated, user);

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

  const roleUpper = String(user?.role || '').toUpperCase();
  const isAdminUser = roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN';

  let assignedToName = null;
  let assignmentStatus = 'Unassigned';
  let resolvedTargetId = targetEmpId;

  if (targetEmpId && targetEmpId !== 'Unassigned' && targetEmpId !== 'none' && targetEmpId !== 'null' && String(targetEmpId).trim() !== '') {
    let lookupTarget = targetEmpId;
    if (targetEmpId === 'me' && user) {
      lookupTarget = user.name || user.email || user.id;
    }

    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: lookupTarget },
          { empCode: lookupTarget },
          { name: { equals: lookupTarget, mode: 'insensitive' } },
          ...(user?.email ? [{ email: { equals: user.email, mode: 'insensitive' } }] : []),
          ...(user?.name ? [{ name: { equals: user.name, mode: 'insensitive' } }] : []),
        ],
      },
    });

    if (emp) {
      assignedToName = emp.name;
      resolvedTargetId = emp.id;
      assignmentStatus = 'Assigned';
    } else {
      assignedToName = user?.name || lookupTarget;
      resolvedTargetId = lookupTarget;
      assignmentStatus = 'Assigned';
    }

    // Role-based validation: regular employees can ONLY assign to themselves ("Move to Assigned")
    if (!isAdminUser && user) {
      const targetLower = String(lookupTarget).toLowerCase();
      const myName = String(user.name || '').toLowerCase();
      const myEmail = String(user.email || '').toLowerCase();
      const myId = String(user.id || '').toLowerCase();
      const isSelf =
        targetLower === myName ||
        targetLower === myEmail ||
        targetLower === myId ||
        targetLower === 'me' ||
        (emp && (emp.name.toLowerCase() === myName || emp.email.toLowerCase() === myEmail || emp.id.toLowerCase() === myId));

      if (!isSelf) {
        const error = new Error('Employees are only allowed to move contacts into their own assigned list.');
        error.status = 403;
        throw error;
      }
    }
  }

  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data: {
      assignedTo: assignedToName ? resolvedTargetId : null,
      assignedToName,
      assignmentStatus,
      updatedAt: new Date(),
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
