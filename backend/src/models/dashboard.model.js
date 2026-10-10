import { prisma } from '../config/prisma.js';

/**
 * Dynamic Dashboard Analytics Model
 * Computes live operational metrics and KPI summaries across all tables
 */
export class DashboardModel {
  static async getOverviewKPIs() {
    const [
      totalContacts,
      totalLeads,
      totalEmployees,
      totalCompanies,
      totalRoles,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.lead.count(),
      prisma.employee.count(),
      prisma.company.count(),
      prisma.role.count(),
    ]);

    const activeContacts = await prisma.contact.count({
      where: { status: { in: ['Active', 'New', 'In Progress'] } },
    });

    const wonContacts = await prisma.contact.count({
      where: { status: 'Won' },
    });

    return {
      contacts: {
        total: totalContacts,
        active: activeContacts,
        won: wonContacts,
      },
      leads: {
        total: totalLeads,
      },
      workforce: {
        employees: totalEmployees,
        roles: totalRoles,
      },
      companies: {
        total: totalCompanies,
      },
    };
  }
}

export const DASHBOARD_MODULE = {
  id: 'dashboard',
  name: 'Dashboard',
  category: 'Core',
  description: 'Executive analytics, revenue, KPIs, and overview charts.',
  getOverviewKPIs: DashboardModel.getOverviewKPIs,
};

export default DashboardModel;
