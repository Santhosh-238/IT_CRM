import { prisma } from '../../config/prisma.js';
import { SYSTEM_MODULES } from '../../services/seedRBAC.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';

/**
 * Create a new custom system/application module
 * POST /api/modules
 */
export async function createModule(req, res) {
  try {
    const { name, category, description, permissionsByRole } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Module name is required.',
      });
    }

    const cleanName = name.trim();
    const cleanCategory = category && category.trim() ? category.trim() : 'Custom';
    const cleanDesc = description && description.trim() ? description.trim() : `Custom module for ${cleanName}`;

    // Generate unique slug / moduleId
    const moduleId = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module name. Could not generate valid module ID.',
      });
    }

    // Check if moduleId already exists in system modules
    const existingSysMod = SYSTEM_MODULES.find(
      (m) => m.id.toLowerCase() === moduleId || m.name.toLowerCase() === cleanName.toLowerCase()
    );

    // Check if moduleId already exists in DB permissions
    const existingDbPerm = await prisma.rolePermission.findFirst({
      where: {
        OR: [
          { moduleId: moduleId },
          { moduleName: { equals: cleanName, mode: 'insensitive' } },
        ],
      },
    });

    if (existingSysMod || existingDbPerm) {
      return res.status(400).json({
        success: false,
        message: `A module with name '${cleanName}' or ID '${moduleId}' already exists.`,
      });
    }

    // Fetch all existing roles in the CRM
    const allRoles = await prisma.role.findMany({
      select: { id: true, slug: true, isSystem: true },
    });

    // Auto-provision RolePermission records for every role in the CRM
    const permissionInserts = allRoles.map((role) => {
      const isSuperAdmin =
        role.slug.toLowerCase().includes('admin') ||
        role.slug.toLowerCase().includes('super');

      const customRolePerm = permissionsByRole ? permissionsByRole[role.id] || permissionsByRole[role.slug] : null;

      return {
        roleId: role.id,
        moduleId,
        moduleName: cleanName,
        category: cleanCategory,
        canView: customRolePerm?.canView !== undefined ? customRolePerm.canView : isSuperAdmin,
        canCreate: customRolePerm?.canCreate !== undefined ? customRolePerm.canCreate : isSuperAdmin,
        canEdit: customRolePerm?.canEdit !== undefined ? customRolePerm.canEdit : isSuperAdmin,
        canDelete: customRolePerm?.canDelete !== undefined ? customRolePerm.canDelete : isSuperAdmin,
        canExport: customRolePerm?.canExport !== undefined ? customRolePerm.canExport : isSuperAdmin,
        canApprove: customRolePerm?.canApprove !== undefined ? customRolePerm.canApprove : isSuperAdmin,
      };
    });

    // Batch create permission records
    if (permissionInserts.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionInserts,
        skipDuplicates: true,
      });
    }

    // Invalidate Redis permissions cache
    try {
      await delCache('crm:permissions:*');
      await delCache('crm:roles:*');
    } catch (e) {}

    // Audit Log
    try {
      await logAuditEvent({
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'MODULE_CREATED',
        targetType: 'Module',
        targetName: cleanName,
        details: `Created new module '${cleanName}' (ID: ${moduleId}) in category '${cleanCategory}' with permissions auto-provisioned across ${allRoles.length} roles.`,
        ipAddress: req.ip,
      });
    } catch (e) {}

    const newModule = {
      id: moduleId,
      name: cleanName,
      category: cleanCategory,
      description: cleanDesc,
      isSystem: false,
      provisionedRolesCount: allRoles.length,
    };

    return res.status(201).json({
      success: true,
      message: `Module '${cleanName}' created successfully and provisioned to ${allRoles.length} roles.`,
      module: newModule,
    });
  } catch (error) {
    console.error('[Create Module Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create module: ' + error.message,
    });
  }
}
