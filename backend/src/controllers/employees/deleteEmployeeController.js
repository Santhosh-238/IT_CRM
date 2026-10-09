import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';
import { io } from '../../server.js';

/**
 * Handle Deleting an Employee Record
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

    // Invalidate Redis Cache
    await delCache('crm:employees:*');

    // Broadcast Real-time event
    if (io) {
      io.emit('employee_deleted', { id });
    }

    // Record Audit Log
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
