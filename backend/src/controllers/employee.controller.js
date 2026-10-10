import * as employeeService from '../services/employee.service.js';

/**
 * 1. Get all employees with optional filtering, search, and Redis caching
 * GET /api/employees
 */
export async function getEmployees(req, res) {
  try {
    const result = await employeeService.getEmployeesService(req.query);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in getEmployees:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Get Single Employee by ID
 * GET /api/employees/:id
 */
export async function getEmployeeById(req, res) {
  try {
    const result = await employeeService.getEmployeeByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Get Employee Statistics & Department KPIs
 * GET /api/employees/stats
 */
export async function getEmployeeStats(_req, res) {
  try {
    const result = await employeeService.getEmployeeStatsService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Create New Employee & User Account
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

    // Ensure user account is created/updated for login
    if (password) {
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        const assignedRole = newEmployee.role || 'STAFF';

        const matchedRole = await prisma.role.findFirst({
          where: {
            OR: [
              { name: { equals: assignedRole, mode: 'insensitive' } },
              { slug: { equals: assignedRole.toLowerCase().replace(/[\s-]+/g, '_'), mode: 'insensitive' } },
            ],
          },
        });

        await prisma.user.upsert({
          where: { email: cleanEmail },
          update: {
            name: newEmployee.name,
            phone: newEmployee.phone,
            passwordHash,
            role: assignedRole,
            roleId: matchedRole?.id || null,
            department: newEmployee.department,
          },
          create: {
            name: newEmployee.name,
            email: cleanEmail,
            phone: newEmployee.phone,
            passwordHash,
            role: assignedRole,
            roleId: matchedRole?.id || null,
            department: newEmployee.department,
          },
        });
      } catch (userErr) {
        console.error('User account creation/sync error:', userErr.message);
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
      ...result,
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Update Employee Details
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
      password,
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

    // Synchronize user credentials if password was provided or employee was updated
    if (password) {
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        const userEmail = updated.email.toLowerCase().trim();
        const assignedRole = updated.role || 'STAFF';

        const matchedRole = await prisma.role.findFirst({
          where: {
            OR: [
              { name: { equals: assignedRole, mode: 'insensitive' } },
              { slug: { equals: assignedRole.toLowerCase().replace(/[\s-]+/g, '_'), mode: 'insensitive' } },
            ],
          },
        });

        await prisma.user.upsert({
          where: { email: userEmail },
          update: {
            name: updated.name,
            phone: updated.phone,
            passwordHash,
            role: assignedRole,
            roleId: matchedRole?.id || null,
            department: updated.department,
          },
          create: {
            name: updated.name,
            email: userEmail,
            phone: updated.phone,
            passwordHash,
            role: assignedRole,
            roleId: matchedRole?.id || null,
            department: updated.department,
          },
        });
      } catch (userErr) {
        console.error('User password update sync error:', userErr.message);
      }
    }

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
      ...result,
    });
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Update Employee Status
 * PATCH /api/employees/:id/status
 */
export async function updateEmployeeStatus(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await employeeService.updateEmployeeStatusService(req.params.id, req.body?.status, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 7. Delete Employee Record
 * DELETE /api/employees/:id
 */
export async function deleteEmployee(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await employeeService.deleteEmployeeService(req.params.id, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
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
