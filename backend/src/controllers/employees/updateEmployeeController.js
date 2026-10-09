import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';
import { io } from '../../server.js';

/**
 * Handle Updating Employee Details
 */
export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      avatar,
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

    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const cleanPhone = String(phone).trim();
      const phoneDigits = cleanPhone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
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
      const duplicatePhone = await prisma.employee.findFirst({
        where: {
          id: { not: id },
          OR: [
            { phone: cleanPhone },
            ...(phoneDigits.length >= 10 ? [{ phone: { contains: phoneDigits.slice(-10) } }] : []),
          ],
        },
      });
      if (duplicatePhone) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this phone number already exists.',
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(phone !== undefined && { phone }),
        ...(avatar && { avatar }),
        ...(empCode && { empCode: String(empCode).trim().toUpperCase() }),
        ...(dob !== undefined && { dob }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(designation && { designation: designation.trim() }),
        ...(department && { department }),
        ...(role && { role }),
        ...(employmentType && { employmentType }),
        ...(status && { status }),
        ...(workLocation && { workLocation }),
        ...(joiningDate && { joiningDate }),
        ...(reportingManager !== undefined && { reportingManager }),
      },
    });

    // Invalidate Redis Cache
    await delCache('crm:employees:*');

    // Broadcast Real-time event
    if (io) {
      io.emit('employee_updated', updated);
    }

    // Record Audit Log
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
 * Handle Updating Employee Status (e.g. Active, Probation, On Leave, Notice Period)
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
