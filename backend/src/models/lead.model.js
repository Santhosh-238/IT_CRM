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
    const fallbackStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Disqualified'];
    return Array.from(new Set([...dbStatuses.map(s => s.status).filter(Boolean), ...fallbackStatuses]));
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
};

export default LeadModel;
