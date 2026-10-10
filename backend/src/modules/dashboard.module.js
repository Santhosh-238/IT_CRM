/**
 * Dashboard & Analytics Module Definition
 */
export const DASHBOARD_MODULE = {
  id: 'dashboard',
  name: 'Dashboard & Analytics',
  category: 'Analytics',
  description: 'Real-time CRM metric visualizations, KPI performance analytics, Redis cache health, and database utilities.',
  actions: ['canView', 'canExport'],
  defaultPermissions: {
    canView: true,
    canExport: true,
  },
  schema: {
    stats: {
      fields: ['totalEmployees', 'activeCount', 'activePercentage', 'avgRating', 'departmentCount', 'departmentBreakdown'],
    },
    redis: {
      fields: ['status', 'memoryUsed', 'connectedClients', 'totalKeys'],
    },
  },
};

export default DASHBOARD_MODULE;
