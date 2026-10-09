import { prisma } from '../../config/prisma.js';
import { getCache, setCache } from '../../config/redis.js';

/**
 * List contacts with search, filters, pagination, and sorting
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

    // Build dynamic where filter
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

    if (assignedTo && assignedTo !== 'All' && assignedTo.trim() !== '') {
      where.assignedTo = { equals: assignedTo.trim() };
    }

    if (assignmentStatus && assignmentStatus !== 'All' && assignmentStatus.trim() !== '') {
      where.assignmentStatus = { equals: assignmentStatus.trim(), mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { profession: { contains: q, mode: 'insensitive' } },
        { contactId: { contains: q, mode: 'insensitive' } },
        { assignedToName: { contains: q, mode: 'insensitive' } },
        { source: { contains: q, mode: 'insensitive' } },
        { remarks: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy = {};
    const validSortFields = [
      'name',
      'email',
      'phone',
      'companyName',
      'createdAt',
      'contactId',
      'status',
      'stage',
      'priority',
      'nextFollowDate',
      'assignedToName',
    ];
    const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
    orderBy[field] = direction;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.contact.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasPrev: pageNum > 1,
        hasNext: pageNum < totalPages,
      },
    });
  } catch (error) {
    console.error('[Get Contacts Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts from database.',
      error: error.message,
    });
  }
}

/**
 * Get Contact by ID or ContactID (CNT-XXXX)
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
      return res.status(404).json({
        success: false,
        message: `Contact with ID '${id}' was not found.`,
      });
    }

    return res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('[Get Contact By ID Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact details.',
      error: error.message,
    });
  }
}

/**
 * Get Contacts Aggregated Summary Statistics
 */
export async function getContactStats(_req, res) {
  try {
    const [
      total,
      newCount,
      activeCount,
      qualifiedCount,
      disqualifiedCount,
      assignedCount,
      unassignedCount,
      highPriorityCount,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { status: 'New' } }),
      prisma.contact.count({ where: { status: 'Active' } }),
      prisma.contact.count({ where: { qualificationStatus: 'Qualified' } }),
      prisma.contact.count({ where: { qualificationStatus: 'Disqualified' } }),
      prisma.contact.count({ where: { assignmentStatus: 'Assigned' } }),
      prisma.contact.count({ where: { assignmentStatus: 'Unassigned' } }),
      prisma.contact.count({ where: { priority: 'High' } }),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        new: newCount,
        active: activeCount,
        qualified: qualifiedCount,
        disqualified: disqualifiedCount,
        assigned: assignedCount,
        unassigned: unassignedCount,
        highPriority: highPriorityCount,
      },
    });
  } catch (error) {
    console.error('[Get Contact Stats Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute contacts statistics.',
      error: error.message,
    });
  }
}

/**
 * 100% Dynamic Metadata Catalogue for Form Selects & Filters
 */
export async function getContactMetadata(_req, res) {
  try {
    const [employees, companies, leads, distinctCategories, distinctSources] = await Promise.all([
      prisma.employee.findMany({
        select: { id: true, name: true, empCode: true, email: true, designation: true, department: true },
        orderBy: { name: 'asc' },
      }),
      prisma.company.findMany({
        select: { id: true, name: true, website: true, industry: true, address: true },
        orderBy: { name: 'asc' },
      }),
      prisma.lead.findMany({
        select: { id: true, leadId: true, title: true, companyName: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.contact.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      }),
      prisma.contact.findMany({
        where: { source: { not: null } },
        select: { source: true },
        distinct: ['source'],
      }),
    ]);

    const staticSources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Other'];
    const dynamicSources = Array.from(new Set([...staticSources, ...distinctSources.map((s) => s.source).filter(Boolean)]));

    const metadata = {
      contactTypes: ['Company Representative', 'Individual'],
      sources: dynamicSources,
      categories: ['Product', 'Service'],
      productOptions: [
        'HRMS',
        'IT CRM',
        'Fintech CRM',
        'Cloud ERP',
        'Custom Enterprise Software',
        'AI & ML Assistant',
        'Mobile Apps (iOS & Android)',
      ],
      serviceOptions: [
        'Cloud Migration & DevOps',
        'Cybersecurity & Compliance',
        'Custom API & Backend Integration',
        'Full-Stack Web Development',
        'Staff Augmentation',
        'UI/UX Design & Consulting',
      ],
      contactModes: ['Call', 'Email', 'Meeting', 'WhatsApp', 'Other'],
      meetingTypes: ['Virtual', 'In-person'],
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
      qualificationStatuses: ['In Progress', 'Qualified', 'Disqualified'],
      priorities: ['High', 'Medium', 'Low'],
      projectTypes: [
        'New Implementation',
        'Legacy Modernization',
        'Custom Module Build',
        'Maintenance & Support',
        'Consulting & PoC',
      ],
      assignmentStatuses: ['Assigned', 'Unassigned'],
      employees,
      companies,
      leads,
    };

    return res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('[Get Contact Metadata Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contact metadata.',
      error: error.message,
    });
  }
}
