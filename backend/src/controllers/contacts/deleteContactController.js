import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';
import { io } from '../../server.js';

/**
 * Handle Deleting a Contact
 */
export async function deleteContact(req, res) {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { contactId: id }],
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID '${id}' not found.`,
      });
    }

    await prisma.contact.delete({
      where: { id: contact.id },
    });

    // Invalidate Redis Caches
    await delCache('crm:contacts:*');

    // WebSocket Broadcast
    if (io) {
      io.emit('contact_deleted', { id: contact.id, contactId: contact.contactId });
    }

    // Audit Log
    await logAuditEvent({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Admin User',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'DELETE',
      entity: 'CONTACT',
      entityId: contact.id,
      ipAddress: req.ip,
      details: `Deleted contact ${contact.name} (${contact.contactId}) from company ${contact.companyName}.`,
    });

    return res.json({
      success: true,
      message: `Contact ${contact.name} (${contact.contactId}) deleted successfully.`,
      data: { id: contact.id, contactId: contact.contactId },
    });
  } catch (error) {
    console.error('[deleteContact Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete contact: ' + error.message,
    });
  }
}
