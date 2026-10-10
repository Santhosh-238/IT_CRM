import { prisma } from '../config/prisma.js';

/**
 * Dynamic Contact Model
 * Interfaces directly with Prisma DB with dynamic metadata extraction and CRUD
 */
export class ContactModel {
  /**
   * Find contacts dynamically with filters, pagination, and sorting
   */
  static async findMany(where = {}, options = {}) {
    const { skip, take, orderBy, select } = options;
    return await prisma.contact.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select,
    });
  }

  /**
   * Find single contact by ID or unique contactId
   */
  static async findById(id) {
    return await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { contactId: id }],
      },
    });
  }

  /**
   * Create new contact in database
   */
  static async create(data) {
    return await prisma.contact.create({ data });
  }

  /**
   * Update contact by ID
   */
  static async update(id, data) {
    return await prisma.contact.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete contact by ID
   */
  static async delete(id) {
    return await prisma.contact.delete({
      where: { id },
    });
  }

  /**
   * Count contacts dynamically
   */
  static async count(where = {}) {
    return await prisma.contact.count({ where });
  }

  /**
   * Fetch dynamic metadata options aggregated from actual database records
   */
  static async getDynamicMetadata() {
    const [
      dbSources,
      dbStatuses,
      dbStages,
      dbCategories,
      dbContactTypes,
      dbPriorities,
      dbQualificationStatuses,
    ] = await Promise.all([
      prisma.contact.findMany({ select: { source: true }, distinct: ['source'] }),
      prisma.contact.findMany({ select: { status: true }, distinct: ['status'] }),
      prisma.contact.findMany({ select: { stage: true }, distinct: ['stage'] }),
      prisma.contact.findMany({ select: { category: true }, distinct: ['category'] }),
      prisma.contact.findMany({ select: { contactType: true }, distinct: ['contactType'] }),
      prisma.contact.findMany({ select: { priority: true }, distinct: ['priority'] }),
      prisma.contact.findMany({ select: { qualificationStatus: true }, distinct: ['qualificationStatus'] }),
    ]);

    const fallbackSources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Social Media', 'Other'];
    const fallbackStatuses = ['New', 'Active', 'Qualified', 'In Progress', 'On Hold', 'Pending', 'Follow-up Required', 'Completed', 'Won', 'Lost', 'Cancelled'];
    const fallbackStages = ['Initialization', 'Qualification', 'Discovery', 'Requirement Analysis', 'Demo / Presentation', 'Proposal / Quotation', 'Negotiation', 'Decision Making', 'Won', 'Lost'];
    const fallbackCategories = ['Product', 'Service'];
    const fallbackContactTypes = ['Individual', 'Company Representative'];
    const fallbackPriorities = ['High', 'Medium', 'Low'];
    const fallbackQualificationStatuses = ['In Progress', 'Qualified', 'Follow-up Required', 'Disqualified'];

    const sources = Array.from(new Set([...dbSources.map(s => s.source).filter(Boolean), ...fallbackSources]));
    const statuses = Array.from(new Set([...dbStatuses.map(s => s.status).filter(Boolean), ...fallbackStatuses]));
    const stages = Array.from(new Set([...dbStages.map(s => s.stage).filter(Boolean), ...fallbackStages]));
    const categories = Array.from(new Set([...dbCategories.map(c => c.category).filter(Boolean), ...fallbackCategories]));
    const contactTypes = Array.from(new Set([...dbContactTypes.map(c => c.contactType).filter(Boolean), ...fallbackContactTypes]));
    const priorities = Array.from(new Set([...dbPriorities.map(p => p.priority).filter(Boolean), ...fallbackPriorities]));
    const qualificationStatuses = Array.from(new Set([...dbQualificationStatuses.map(q => q.qualificationStatus).filter(Boolean), ...fallbackQualificationStatuses]));

    return {
      sources,
      statuses,
      stages,
      categories,
      contactTypes,
      priorities,
      qualificationStatuses,
      productOptions: [
        'HRMS',
        'IT CRM',
        'Fintech CRM',
        'Cloud ERP',
        'Custom Enterprise Software',
        'AI & ML Assistant',
        'Mobile Apps',
      ],
      serviceOptions: [
        'Cloud Migration & DevOps',
        'Cybersecurity & Compliance',
        'Custom API & Backend Integration',
        'Full-Stack Web Development',
        'Staff Augmentation',
        'UI/UX Design',
      ],
    };
  }
}

/**
 * Backward compatibility Module Definition
 */
export const CONTACT_MODULE = {
  id: 'contacts',
  name: 'Contacts',
  category: 'Sales & CRM',
  description: 'Enterprise contact management, multi-stage sales pipeline tracking, lead qualification, and representative assignment.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
  },
  getDynamicMetadata: ContactModel.getDynamicMetadata,
};

export default ContactModel;
