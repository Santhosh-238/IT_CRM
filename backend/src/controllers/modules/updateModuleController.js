import { prisma } from '../../config/prisma.js';
import { SYSTEM_MODULES } from '../../services/seedRBAC.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';

/**
 * Update module metadata (Name, Category) across all role permission entries
 * PUT /api/modules/:id
 */
export async function updateModule(req, res) {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const cleanId = String(id).toLowerCase().trim();

    // Check if it's a protected system module
    const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);
    if (sysMod) {
      return res.status(403).json({
        success: false,
        message: `System module '${sysMod.name}' cannot be modified.`,
      });
    }

    const existing = await prisma.rolePermission.findFirst({
      where: { moduleId: cleanId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Custom module '${id}' not found.`,
      });
    }

    const updateData = {};
    if (name && name.trim()) updateData.moduleName = name.trim();
    if (category && category.trim()) updateData.category = category.trim();

    // Update across all role permissions
    await prisma.rolePermission.updateMany({
      where: { moduleId: cleanId },
      data: updateData,
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
        action: 'MODULE_UPDATED',
        targetType: 'Module',
        targetName: updateData.moduleName || existing.moduleName,
        details: `Updated custom module '${cleanId}'.`,
        ipAddress: req.ip,
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Module '${cleanId}' updated successfully.`,
      module: {
        id: cleanId,
        name: updateData.moduleName || existing.moduleName,
        category: updateData.category || existing.category,
      },
    });
  } catch (error) {
    console.error('[Update Module Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update module: ' + error.message,
    });
  }
}
