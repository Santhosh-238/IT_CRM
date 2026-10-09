import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';
import { io } from '../../server.js';

/**
 * Handle Onboarding / Creating a New Employee & Creating User Login Account
 */
export async function createEmployee(req, res) {
  try {
    const {
      name,
      email,
      phone,
      avatar,
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

    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
      });
    }

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Login Password is mandatory (minimum 6 characters).',
      });
    }

    const hasLetter = /[a-zA-Z]/.test(String(password));
    const hasNumber = /\d/.test(String(password));
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Login Password must contain at least one letter and one number.',
      });
    }

    const cleanPhone = String(phone).trim();

    // Check if email already exists in Employee table
    const existingEmailEmp = await prisma.employee.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmailEmp) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email address already exists.',
      });
    }

    // Check if phone number already exists in Employee table
    const existingPhoneEmp = await prisma.employee.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(phoneDigits.length >= 10 ? [{ phone: { contains: phoneDigits.slice(-10) } }] : []),
        ],
      },
    });

    if (existingPhoneEmp) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this phone number already exists.',
      });
    }

    // Determine employee code (EMP-1001, EMP-1002...)
    let finalEmpCode = customEmpCode ? String(customEmpCode).trim().toUpperCase() : '';
    if (!finalEmpCode) {
      const totalCount = await prisma.employee.count();
      finalEmpCode = `EMP-${(1000 + totalCount + 1).toString()}`;
    } else {
      const existingCode = await prisma.employee.findUnique({
        where: { empCode: finalEmpCode },
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: `Employee ID ${finalEmpCode} already exists.`,
        });
      }
    }

    // 1. Create Employee Record
    const newEmployee = await prisma.employee.create({
      data: {
        empCode: finalEmpCode,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        avatar: avatar || null,
        dob: dob ? String(dob).trim() : null,
        gender: gender ? String(gender).trim() : null,
        address: address ? String(address).trim() : null,
        designation: designation ? designation.trim() : 'Employee',
        department: department ? String(department).trim() : 'Engineering',
        role: role ? String(role).trim() : 'Developer',
        employmentType: employmentType ? String(employmentType).trim() : 'Full Time',
        status: status ? String(status).trim() : 'Active',
        workLocation: workLocation ? String(workLocation).trim() : 'Chennai HQ',
        joiningDate: joiningDate ? String(joiningDate).trim() : '',
        reportingManager: reportingManager ? String(reportingManager).trim() : null,
      },
    });

    // 2. Create / Sync User Login Account for this Employee
    const userPassword = password && String(password).trim() !== '' ? String(password).trim() : 'Welcome@123';
    const passwordHash = await bcrypt.hash(userPassword, 10);

    await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: name.trim(),
        phone: phone ? String(phone).trim() : null,
        role: role ? String(role).trim() : 'Developer',
        department: department ? String(department).trim() : '',
        avatar: avatar || null,
      },
      create: {
        email: cleanEmail,
        name: name.trim(),
        phone: phone ? String(phone).trim() : null,
        passwordHash,
        role: role ? String(role).trim() : 'Developer',
        department: department ? String(department).trim() : '',
        avatar: avatar || null,
      },
    });

    // Invalidate Redis Caches
    await delCache('crm:employees:*');

    // Broadcast Real-time event
    if (io) {
      io.emit('employee_created', newEmployee);
    }

    // Record Security Audit Log
    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'CREATE',
      entity: 'EMPLOYEE',
      entityId: newEmployee.id,
      ipAddress: req.ip,
      details: `Onboarded employee ${newEmployee.name} (${newEmployee.empCode}) as ${newEmployee.designation}. User login credentials created.`,
    });

    return res.status(201).json({
      success: true,
      message: `Employee ${newEmployee.name} onboarded successfully! Login account initialized.`,
      data: newEmployee,
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
