import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';
import { io } from '../../server.js';

/**
 * Handle Assigning a Contact to an Employee
 * PUT /api/contacts/:id/assign
 */
export async function assignContact(req, res) {
  try {
    const { id } = req.params;
    const { employeeId, assignedTo, assignedBy } = req.body;

    const targetEmpId = employeeId !== undefined ? employeeId : assignedTo;

    const existing = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { contactId: id }, { uuid: id }],
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Contact '${id}' not found.`,
      });
    }

    let assignedToName = null;
    let assignmentStatus = 'Unassigned';
    let assignedAt = null;

    if (targetEmpId && targetEmpId !== 'Unassigned' && targetEmpId !== 'none') {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [{ id: targetEmpId }, { empCode: targetEmpId }],
        },
      });

      if (emp) {
        assignedToName = emp.name;
        assignmentStatus = 'Assigned';
        assignedAt = new Date();
      } else {
        // Fallback if targetEmpId is a string name
        assignedToName = String(targetEmpId);
        assignmentStatus = 'Assigned';
        assignedAt = new Date();
      }
    }

    const updated = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        assignedTo: targetEmpId && targetEmpId !== 'Unassigned' && targetEmpId !== 'none' ? targetEmpId : null,
        assignedToName,
        assignmentStatus,
        assignedAt,
        assignedBy: assignedBy || req.user?.name || 'System Admin',
      },
    });

    // Invalidate Redis Caches
    try {
      await delCache('crm:contacts:*');
      await delCache('crm:stats');
    } catch (e) {}

    // Broadcast WebSocket event
    if (io) {
      io.emit('contact_updated', updated);
    }

    // Audit Log
    try {
      await logAuditEvent({
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Admin User',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'ASSIGN',
        entity: 'CONTACT',
        entityId: updated.id,
        ipAddress: req.ip,
        details: `Assigned contact ${updated.name} (${updated.contactId}) to ${assignedToName || 'Unassigned'}.`,
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: assignedToName
        ? `Contact '${updated.name}' assigned to ${assignedToName}.`
        : `Contact '${updated.name}' unassigned.`,
      data: updated,
    });
  } catch (error) {
    console.error('[Assign Contact Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign contact: ' + error.message,
    });
  }
}
