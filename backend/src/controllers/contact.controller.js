import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache } from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';
import { io } from '../utils/socket.js';
import crypto from 'crypto';

/**
 * 1. List contacts with search, filters, pagination, and sorting
 * GET /api/contacts
 */
export async function getContacts(req, res) {
  try {
    const {
      search = '',
      companyName,
      contactType,
      category,
      source,
      status,
      stage,
      qualificationStatus,
      priority,
      assignedTo,
      assignmentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (companyName && companyName !== 'All' && companyName.trim() !== '') {
      where.companyName = { equals: companyName.trim(), mode: 'insensitive' };
    }
    if (contactType && contactType !== 'All' && contactType.trim() !== '') {
      where.contactType = { equals: contactType.trim(), mode: 'insensitive' };
    }
    if (category && category !== 'All' && category.trim() !== '') {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }
    if (source && source !== 'All' && source.trim() !== '') {
      where.source = { equals: source.trim(), mode: 'insensitive' };
    }
    if (status && status !== 'All' && status.trim() !== '') {
      where.status = { equals: status.trim(), mode: 'insensitive' };
    }
    if (stage && stage !== 'All' && stage.trim() !== '') {
      where.stage = { equals: stage.trim(), mode: 'insensitive' };
    }
    if (qualificationStatus && qualificationStatus !== 'All' && qualificationStatus.trim() !== '') {
      where.qualificationStatus = { equals: qualificationStatus.trim(), mode: 'insensitive' };
    }
    if (priority && priority !== 'All' && priority.trim() !== '') {
      where.priority = { equals: priority.trim(), mode: 'insensitive' };
    }
    if (assignedTo && assignedTo !== 'All') {
      where.assignedTo = assignedTo;
    }
    if (assignmentStatus && assignmentStatus !== 'All') {
      where.assignmentStatus = assignmentStatus;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { contactId: { contains: q, mode: 'insensitive' } },
      ];
    }

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

    return res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[getContacts Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Get Single Contact by ID
 * GET /api/contacts/:id
 */
export async function getContactById(req, res) {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { contactId: id }, { uuid: id }],
      },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    return res.json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Get Contact KPI Stats
 * GET /api/contacts/stats
 */
export async function getContactStats(_req, res) {
  try {
    const [total, assigned, qualified, won] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { assignmentStatus: 'Assigned' } }),
      prisma.contact.count({ where: { stage: 'Qualification' } }),
      prisma.contact.count({ where: { stage: 'Closed Won' } }),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        assigned,
        qualified,
        won,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Get Contact Dropdown Metadata
 * GET /api/contacts/metadata
 */
export async function getContactMetadata(_req, res) {
  try {
    const [employees, companies] = await Promise.all([
      prisma.employee.findMany({
        select: { id: true, name: true, empCode: true, department: true, designation: true },
      }),
      prisma.company.findMany({
        select: { id: true, name: true },
      }).catch(() => []),
    ]);

    return res.json({
      success: true,
      data: {
        employees,
        companies,
        stages: [
          'Qualification',
          'Discovery',
          'Requirement Analysis',
          'Proposal',
          'Negotiation',
          'Demo / Presentation',
          'Decision Making',
          'Contract / Agreement',
          'Closed Won',
          'Closed Lost',
        ],
        statuses: [
          'New',
          'Active',
          'Qualified',
          'In Progress',
          'On Hold',
          'Pending',
          'Follow-up Required',
          'Completed',
          'Won',
          'Lost',
          'Cancelled',
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Create Contact
 * POST /api/contacts
 */
export async function createContact(req, res) {
  try {
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
      stage = 'Qualification',
      qualificationStatus = 'In Progress',
      priority = 'Medium',
      assignedTo,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name is required.' });
    }

    const finalPhone = phone || mobile_number;
    if (!finalPhone || !String(finalPhone).trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const count = await prisma.contact.count();
    const contactId = `CNT-${1000 + count + 1}`;

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
        stage: stage || 'Qualification',
        qualificationStatus: qualificationStatus || 'In Progress',
        priority: priority || 'Medium',
        assignedTo: assignedTo && assignedTo !== 'none' ? assignedTo : null,
        assignedToName,
        assignmentStatus,
        assignedAt: assignedToName ? new Date() : null,
        createdBy: req.user?.name || 'System Admin',
      },
    });

    await delCache('crm:contacts:*');

    if (io) {
      io.emit('contact_created', newContact);
    }

    return res.status(201).json({
      success: true,
      message: `Contact '${newContact.name}' created successfully!`,
      data: newContact,
    });
  } catch (error) {
    console.error('[createContact Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Update Contact
 * PUT /api/contacts/:id
 */
export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.contact.findFirst({
      where: { OR: [{ id }, { contactId: id }, { uuid: id }] },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const updated = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.email !== undefined && { email: body.email ? body.email.toLowerCase().trim() : null }),
        ...(body.phone && { phone: String(body.phone).trim() }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.companyName !== undefined && { companyName: body.companyName }),
        ...(body.designation !== undefined && { designation: body.designation }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.stage !== undefined && { stage: body.stage }),
        ...(body.qualificationStatus !== undefined && { qualificationStatus: body.qualificationStatus }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.remarks !== undefined && { remarks: body.remarks }),
        ...(body.nextFollowDate !== undefined && { nextFollowDate: body.nextFollowDate }),
      },
    });

    await delCache('crm:contacts:*');

    if (io) {
      io.emit('contact_updated', updated);
    }

    return res.json({ success: true, message: 'Contact updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 7. Assign Contact
 * PUT /api/contacts/:id/assign
 */
export async function assignContact(req, res) {
  try {
    const { id } = req.params;
    const { employeeId, assignedTo } = req.body;
    const targetEmpId = employeeId !== undefined ? employeeId : assignedTo;

    const existing = await prisma.contact.findFirst({
      where: { OR: [{ id }, { contactId: id }, { uuid: id }] },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
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
        assignedBy: req.user?.name || 'System Admin',
      },
    });

    await delCache('crm:contacts:*');

    if (io) {
      io.emit('contact_assigned', updated);
    }

    return res.json({ success: true, message: 'Contact assigned successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 8. Delete Contact
 * DELETE /api/contacts/:id
 */
export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findFirst({
      where: { OR: [{ id }, { contactId: id }] },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    await prisma.contact.delete({ where: { id: contact.id } });
    await delCache('crm:contacts:*');

    if (io) {
      io.emit('contact_deleted', { id: contact.id });
    }

    return res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  getContacts,
  getContactById,
  getContactStats,
  getContactMetadata,
  createContact,
  updateContact,
  assignContact,
  deleteContact,
};
