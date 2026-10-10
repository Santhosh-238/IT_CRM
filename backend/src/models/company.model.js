import { prisma } from '../config/prisma.js';

/**
 * Dynamic Company Model
 * Interfaces with Prisma ORM for company accounts and industries
 */
export class CompanyModel {
  static async findMany(where = {}, options = {}) {
    const { skip, take, orderBy, select } = options;
    return await prisma.company.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select,
    });
  }

  static async findById(id) {
    return await prisma.company.findFirst({
      where: {
        OR: [{ id }, { name: id }],
      },
    });
  }

  static async create(data) {
    return await prisma.company.create({ data });
  }

  static async update(id, data) {
    return await prisma.company.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    return await prisma.company.delete({
      where: { id },
    });
  }

  static async count(where = {}) {
    return await prisma.company.count({ where });
  }

  static async getDynamicIndustries() {
    const dbIndustries = await prisma.company.findMany({
      select: { industry: true },
      distinct: ['industry'],
    });
    const fallbackIndustries = ['Information Technology', 'Fintech', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Services', 'Other'];
    return Array.from(new Set([...dbIndustries.map(i => i.industry).filter(Boolean), ...fallbackIndustries]));
  }
}

export const COMPANY_MODULE = {
  id: 'companies',
  name: 'Companies',
  category: 'Sales & CRM',
  description: 'Enterprise company profiles, industry categorization, and account management.',
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
  },
  getDynamicIndustries: CompanyModel.getDynamicIndustries,
};

export default CompanyModel;
