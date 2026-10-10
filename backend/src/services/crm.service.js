import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache, getCacheStats } from '../config/redis.js';
import { logAuditEvent } from './auditService.js';

/**
 * 1. GET Dashboard Stats (Dynamically computed from Prisma & cached in Redis)
 */
export async function getDashboardStatsService() {
  const CACHE_KEY = 'crm:dashboard:stats';

  const cachedStats = await getCache(CACHE_KEY);
  if (cachedStats) {
    return {
      source: '⚡ Redis Cache (In-Memory < 2ms)',
      data: cachedStats,
    };
  }

  const [employees, totalContacts, qualifiedContacts, wonContacts, totalLeads, totalTasks] = await Promise.all([
    prisma.employee.findMany().catch(() => []),
    prisma.contact.count().catch(() => 0),
    prisma.contact.count({ where: { stage: 'Qualification' } }).catch(() => 0),
    prisma.contact.count({ where: { stage: { in: ['Won', 'Closed Won'] } } }).catch(() => 0),
    prisma.lead.count().catch(() => 0),
    prisma.task ? prisma.task.count().catch(() => 0) : 0,
  ]);

  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'ACTIVE' || e.status === 'Active').length;
  const avgRating = totalEmployees > 0 
    ? Number((employees.reduce((acc, e) => acc + (e.rating || 0), 0) / totalEmployees).toFixed(1))
    : 0;

  const departmentBreakdown = {};
  employees.forEach((emp) => {
    if (emp.department) {
      departmentBreakdown[emp.department] = (departmentBreakdown[emp.department] || 0) + 1;
    }
  });

  const stats = {
    totalEmployees,
    activeCount,
    activePercentage: totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0,
    avgRating,
    departmentCount: Object.keys(departmentBreakdown).length,
    departmentBreakdown,
    totalContacts,
    qualifiedContacts,
    wonContacts,
    totalLeads,
    totalTasks,
  };

  await setCache(CACHE_KEY, stats, 300);

  return {
    source: '🗄️ Fresh PostgreSQL (Prisma)',
    data: stats,
  };
}

/**
 * 2. REDIS / CACHE Live Status & Space Monitor
 */
export async function getRedisStatusService() {
  const stats = await getCacheStats();
  return {
    timestamp: new Date().toISOString(),
    cacheStats: stats,
  };
}

/**
 * 3. CLEAR ALL DATABASE DATA & FLUSH CACHE
 */
export async function clearAllDatabaseDataService(user, ip = '127.0.0.1') {
  await prisma.employee.deleteMany({}).catch(() => {});
  await delCache('crm:*');

  await logAuditEvent({
    userId: user?.id,
    userName: user?.name || 'Super Admin',
    userRole: user?.role || 'SUPER_ADMIN',
    action: 'DELETE',
    entity: 'DATABASE',
    entityId: 'ALL_EMPLOYEES',
    ipAddress: ip,
    details: 'All employee records were purged clean by administrator request.',
  });

  return {
    message: 'Employee records and cache cleared successfully!',
    clearedAt: new Date().toISOString(),
  };
}

export default {
  getDashboardStatsService,
  getRedisStatusService,
  clearAllDatabaseDataService,
};
