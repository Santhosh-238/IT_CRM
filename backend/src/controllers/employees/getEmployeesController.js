import { prisma } from '../../config/prisma.js';
import { getCache, setCache } from '../../config/redis.js';

/**
 * Get all employees with optional filtering, search, and Redis caching (<1ms)
 */
export async function getEmployees(req, res) {
  const { department, status, role, employmentType, search } = req.query;
  const CACHE_KEY = `crm:employees:all:${department || 'all'}:${status || 'all'}:${role || 'all'}:${employmentType || 'all'}:${search || ''}`;

  try {
    // Check Redis Cache
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      return res.json({
        success: true,
        source: '⚡ Redis Cache (<1ms)',
        data: cached,
      });
    }

    // Build Prisma query filter
    const where = {};

    if (department && department !== 'ALL') {
      where.department = String(department);
    }
    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    if (role && role !== 'ALL') {
      where.role = String(role);
    }
    if (employmentType && employmentType !== 'ALL') {
      where.employmentType = String(employmentType);
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { empCode: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Cache in Redis for 5 minutes
    await setCache(CACHE_KEY, employees, 300);

    return res.json({
      success: true,
      source: '🗄️ PostgreSQL Database',
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error('Error in getEmployees:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get Single Employee by ID
 */
export async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    return res.json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get Employee Statistics & Department KPIs
 */
export async function getEmployeeStats(_req, res) {
  const CACHE_KEY = 'crm:employees:stats';
  try {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      return res.json({ success: true, source: '⚡ Redis Cache', stats: cached });
    }

    const employees = await prisma.employee.findMany();

    const totalEmployees = employees.length;
    const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
    const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;

    // Department Distribution
    const departmentBreakdown = {};
    employees.forEach((emp) => {
      departmentBreakdown[emp.department] = (departmentBreakdown[emp.department] || 0) + 1;
    });

    // Average Performance Rating
    const avgRating = totalEmployees > 0 
      ? Number((employees.reduce((acc, e) => acc + (e.rating || 0), 0) / totalEmployees).toFixed(1))
      : 0;

    const stats = {
      totalEmployees,
      activeCount,
      probationCount,
      onLeaveCount,
      activePercentage: totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0,
      avgRating,
      departmentBreakdown,
    };

    await setCache(CACHE_KEY, stats, 300);

    return res.json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
