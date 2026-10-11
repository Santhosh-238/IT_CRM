import { prisma } from '../config/prisma.js';

/**
 * Dynamic Lead Model
 * Interfaces with Prisma ORM for sales lead operations
 */
export class LeadModel {
  static async findMany(where = {}, options = {}) {
    const { skip, take, orderBy, select } = options;
    return await prisma.lead.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select,
    });
  }

  static async findById(id) {
    return await prisma.lead.findFirst({
      where: {
        OR: [{ id }, { leadId: id }],
      },
    });
  }

  static async create(data) {
    return await prisma.lead.create({ data });
  }

  static async update(id, data) {
    return await prisma.lead.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    return await prisma.lead.delete({
      where: { id },
    });
  }

  static async count(where = {}) {
    return await prisma.lead.count({ where });
  }

  static async getDynamicStatuses() {
    const dbStatuses = await prisma.lead.findMany({
      select: { status: true },
      distinct: ['status'],
    });
    const fallbackStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'In Negotiation', 'Won', 'Lost'];
    return Array.from(new Set([...dbStatuses.map(s => s.status).filter(Boolean), ...fallbackStatuses]));
  }

  static async getDynamicMetadata() {
    const [
      dbSources,
      dbStatuses,
      dbStages,
      dbCategories,
      dbContactTypes,
    ] = await Promise.all([
      prisma.lead.findMany({ select: { source: true }, distinct: ['source'] }),
      prisma.lead.findMany({ select: { status: true }, distinct: ['status'] }),
      prisma.lead.findMany({ select: { stage: true }, distinct: ['stage'] }),
      prisma.lead.findMany({ select: { category: true }, distinct: ['category'] }),
      prisma.lead.findMany({ select: { contactType: true }, distinct: ['contactType'] }),
    ]);

    const fallbackSources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Social Media', 'Other'];
    const fallbackStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'In Negotiation', 'Won', 'Lost'];
    const fallbackStages = ['Initialization', 'Qualification', 'Discovery', 'Requirement Analysis', 'Demo / Presentation', 'Proposal / Quotation', 'Negotiation', 'Decision Making', 'Won', 'Lost'];
    const fallbackCategories = ['Product', 'Service'];
    const fallbackContactTypes = ['Individual', 'Company Representative'];

    const sources = Array.from(new Set([...dbSources.map(s => s.source).filter(Boolean), ...fallbackSources]));
    const statuses = Array.from(new Set([...dbStatuses.map(s => s.status).filter(Boolean), ...fallbackStatuses]));
    const stages = Array.from(new Set([...dbStages.map(s => s.stage).filter(Boolean), ...fallbackStages]));
    const categories = Array.from(new Set([...dbCategories.map(c => c.category).filter(Boolean), ...fallbackCategories]));
    const contactTypes = Array.from(new Set([...dbContactTypes.map(c => c.contactType).filter(Boolean), ...fallbackContactTypes]));

    return {
      sources,
      statuses,
      stages,
      categories,
      contactTypes,
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

export const LEAD_MODULE = {
  id: 'leads',
  name: 'Leads',
  category: 'Sales & CRM',
  description: 'Inbound sales opportunities, prospective customer conversion, and pipeline management.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
  },
  getDynamicStatuses: LeadModel.getDynamicStatuses,
  getDynamicMetadata: LeadModel.getDynamicMetadata,
};

export default LeadModel;
