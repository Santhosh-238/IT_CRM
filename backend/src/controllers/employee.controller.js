import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache } from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';
import { io } from '../utils/socket.js';

/**
 * Get all employees with optional filtering, search, and Redis caching (<1ms)
 * GET /api/employees
 */
export async function getEmployees(req, res) {
  const { department, status, role, employmentType, search } = req.query;
  const CACHE_KEY = `crm:employees:all:${department || 'all'}:${status || 'all'}:${role || 'all'}:${employmentType || 'all'}:${search || ''}`;

  try {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      return res.json({
        success: true,
        source: '⚡ Redis Cache (<1ms)',
        data: cached,
      });
    }

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
 * GET /api/employees/:id
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
 * GET /api/employees/stats
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
    const activeCount = employees.filter((e) => e.status === 'ACTIVE' || e.status === 'Active').length;
    const probationCount = employees.filter((e) => e.status === 'PROBATION' || e.status === 'Probation').length;
    const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE' || e.status === 'On Leave').length;

    const departmentBreakdown = {};
    employees.forEach((emp) => {
      departmentBreakdown[emp.department] = (departmentBreakdown[emp.department] || 0) + 1;
    });

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

/**
 * Handle Onboarding / Creating a New Employee & Creating User Login Account
 * POST /api/employees
 */
export async function createEmployee(req, res) {
  try {
    const {
      name,
      email,
      phone,
      empCode: customEmpCode,
      dob,
      gender,
      address,
      designation,
      department,
      role,
      employmentType,
      status,
      workLocation,
      joiningDate,
      reportingManager,
      password,
    } = req.body;

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Full Name is mandatory (minimum 3 characters).',
      });
    }

    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Email is mandatory.',
      });
    }

    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone Number must be exactly 10 digits.',
      });
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email address already exists.',
      });
    }

    let finalEmpCode = customEmpCode;
    if (!finalEmpCode) {
      const count = await prisma.employee.count();
      finalEmpCode = `EMP-${String(count + 1).padStart(3, '0')}`;
    }

    const newEmployee = await prisma.employee.create({
      data: {
        empCode: finalEmpCode,
        name: String(name).trim(),
        email: cleanEmail,
        phone: phoneDigits,
        dob: dob || null,
        gender: gender || null,
        address: address || null,
        department: department || 'Engineering',
        designation: designation || 'Employee',
        role: role || 'Developer',
        employmentType: employmentType || 'Full Time',
        status: status || 'Active',
        workLocation: workLocation || 'Chennai HQ',
        joiningDate: joiningDate || '',
        reportingManager: reportingManager || null,
      },
    });

    // Optionally create user account for login
    if (password) {
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
          data: {
            name: newEmployee.name,
            email: newEmployee.email,
            phone: newEmployee.phone,
            passwordHash,
            role: newEmployee.role || 'STAFF',
            department: newEmployee.department,
          },
        });
      } catch (userErr) {
        console.warn('User account creation skipped or failed:', userErr.message);
      }
    }

    await delCache('crm:employees:*');

    if (io) {
      io.emit('employee_created', newEmployee);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'CREATE',
      entity: 'EMPLOYEE',
      entityId: newEmployee.id,
      ipAddress: req.ip,
      details: `Onboarded employee ${newEmployee.name} (${newEmployee.empCode}) into ${newEmployee.department}`,
    });

    return res.status(201).json({
      success: true,
      message: `Employee ${newEmployee.name} created successfully!`,
      data: newEmployee,
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Handle Updating Employee Details
 * PUT /api/employees/:id
 */
export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      empCode,
      dob,
      gender,
      address,
      designation,
      department,
      role,
      employmentType,
      status,
      workLocation,
      joiningDate,
      reportingManager,
    } = req.body;

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const duplicateEmail = await prisma.employee.findFirst({
        where: {
          email: cleanEmail,
          id: { not: id },
        },
      });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email address already exists.',
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(email && { email: String(email).toLowerCase().trim() }),
        ...(phone !== undefined && { phone: String(phone).replace(/\D/g, '') }),
        ...(empCode && { empCode }),
        ...(dob !== undefined && { dob }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(designation && { designation }),
        ...(department && { department }),
        ...(role && { role }),
        ...(employmentType && { employmentType }),
        ...(status && { status }),
        ...(workLocation && { workLocation }),
        ...(joiningDate !== undefined && { joiningDate }),
        ...(reportingManager !== undefined && { reportingManager }),
      },
    });

    await delCache('crm:employees:*');

    if (io) {
      io.emit('employee_updated', updated);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'UPDATE',
      entity: 'EMPLOYEE',
      entityId: updated.id,
      ipAddress: req.ip,
      details: `Updated employee details for ${updated.name} (${updated.empCode})`,
    });

    return res.json({
      success: true,
      message: `Employee ${updated.name} updated successfully.`,
      data: updated,
    });
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Handle Updating Employee Status
 * PATCH /api/employees/:id/status
 */
export async function updateEmployeeStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { status },
    });

    await delCache('crm:employees:*');

    if (io) {
      io.emit('employee_updated', updated);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'STATUS_CHANGE',
      entity: 'EMPLOYEE',
      entityId: updated.id,
      ipAddress: req.ip,
      details: `Changed status of ${updated.name} to ${status}`,
    });

    return res.json({ success: true, message: `Status updated to ${status}.`, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Handle Deleting an Employee Record
 * DELETE /api/employees/:id
 */
export async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await prisma.employee.delete({
      where: { id },
    });

    await delCache('crm:employees:*');

    if (io) {
      io.emit('employee_deleted', { id });
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'DELETE',
      entity: 'EMPLOYEE',
      entityId: id,
      ipAddress: req.ip,
      details: `Removed employee record for ${existing.name} (${existing.empCode})`,
    });

    return res.json({
      success: true,
      message: `Employee record for ${existing.name} has been removed.`,
    });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  getEmployees,
  getEmployeeById,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
};
