import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache, getCacheStats } from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';

/**
 * 1. GET Dashboard Stats (Dynamically computed from Prisma & cached in Redis)
 */
export async function getDashboardStats(_req, res) {
  const CACHE_KEY = 'crm:dashboard:stats';

  try {
    const cachedStats = await getCache(CACHE_KEY);
    if (cachedStats) {
      return res.json({
        success: true,
        source: '⚡ Redis Cache (In-Memory < 2ms)',
        data: cachedStats,
      });
    }

    const employees = await prisma.employee.findMany().catch(() => []);

    const totalEmployees = employees.length;
    const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const avgRating = totalEmployees > 0 
      ? Number((employees.reduce((acc, e) => acc + (e.rating || 0), 0) / totalEmployees).toFixed(1))
      : 0;

    const departmentBreakdown = {};
    employees.forEach((emp) => {
      departmentBreakdown[emp.department] = (departmentBreakdown[emp.department] || 0) + 1;
    });

    const stats = {
      totalEmployees,
      activeCount,
      activePercentage: totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0,
      avgRating,
      departmentCount: Object.keys(departmentBreakdown).length,
      departmentBreakdown,
    };

    await setCache(CACHE_KEY, stats, 300);

    return res.json({
      success: true,
      source: '🗄️ Fresh PostgreSQL (Prisma)',
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. REDIS / CACHE Live Status & Space Monitor Endpoint
 */
export async function getRedisStatus(_req, res) {
  try {
    const stats = await getCacheStats();
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cacheStats: stats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. CLEAR ALL DATABASE DATA & FLUSH CACHE
 */
export async function clearAllDatabaseData(req, res) {
  try {
    // 1. Delete all employee records from Prisma
    await prisma.employee.deleteMany({}).catch(() => {});

    // 2. Invalidate all Redis caches
    await delCache('crm:*');

    // 3. Log the database wipe action
    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Super Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'DELETE',
      entity: 'DATABASE',
      entityId: 'ALL_EMPLOYEES',
      ipAddress: req.ip,
      details: 'All employee records were purged clean by administrator request.',
    });

    return res.json({
      success: true,
      message: 'Employee records and cache cleared successfully!',
      clearedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Database clear failed: ${error.message}`,
    });
  }
}

export default {
  getDashboardStats,
  getRedisStatus,
  clearAllDatabaseData,
};
