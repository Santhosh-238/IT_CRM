import { prisma } from '../../config/prisma.js';
import { SYSTEM_MODULES } from '../../services/seedRBAC.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';

/**
 * Delete a custom module and clean up its role permission entries
 * DELETE /api/modules/:id
 */
export async function deleteModule(req, res) {
  try {
    const { id } = req.params;
    const cleanId = String(id).toLowerCase().trim();

    // Prevent deleting built-in system modules
    const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);
    if (sysMod) {
      return res.status(403).json({
        success: false,
        message: `System module '${sysMod.name}' is essential to CRM core operations and cannot be deleted.`,
      });
    }

    const count = await prisma.rolePermission.count({
      where: { moduleId: cleanId },
    });

    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: `Custom module '${id}' not found.`,
      });
    }

    // Delete all permissions associated with this module
    await prisma.rolePermission.deleteMany({
      where: { moduleId: cleanId },
    });

    // Invalidate caches
    try {
      await delCache('crm:permissions:*');
      await delCache('crm:roles:*');
    } catch (e) {}

    // Audit log
    try {
      await logAuditEvent({
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'MODULE_DELETED',
        targetType: 'Module',
        targetName: cleanId,
        details: `Deleted custom module '${cleanId}' and cleaned up ${count} role permission entries.`,
        ipAddress: req.ip,
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Custom module '${cleanId}' deleted successfully.`,
    });
  } catch (error) {
    console.error('[Delete Module Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete module: ' + error.message,
    });
  }
}
