import { prisma } from '../../config/prisma.js';
import { SYSTEM_MODULES } from '../../services/seedRBAC.js';

/**
 * Create a new custom role with granular permissions
 */
export async function createRole(req, res) {
  try {
    const { name, description, appType, parentRoleId, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [{ name: { equals: cleanName, mode: 'insensitive' } }, { slug }],
      },
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: `A role with the name '${cleanName}' already exists.`,
      });
    }

    // Create the role
    const newRole = await prisma.role.create({
      data: {
        name: cleanName,
        slug,
        description: description || '',
        appType: appType || 'admin',
        parentRoleId: parentRoleId || null,
        isSystem: false,
      },
    });

    // Build permissions list for all system modules
    const permissionsData = SYSTEM_MODULES.map((mod) => {
      const customPerm = Array.isArray(permissions)
        ? permissions.find((p) => p.moduleId === mod.id)
        : null;

      return {
        roleId: newRole.id,
        moduleId: mod.id,
        moduleName: mod.name,
        category: mod.category,
        canView: Boolean(customPerm?.canView),
        canCreate: Boolean(customPerm?.canCreate),
        canEdit: Boolean(customPerm?.canEdit),
        canDelete: Boolean(customPerm?.canDelete),
        canExport: Boolean(customPerm?.canExport),
        canApprove: Boolean(customPerm?.canApprove),
      };
    });

    // Insert permissions
    for (const p of permissionsData) {
      await prisma.rolePermission.create({
        data: p,
      });
    }

    // Create audit log
    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'ROLE_CREATED',
        targetType: 'Role',
        targetName: newRole.name,
        details: JSON.stringify({
          roleId: newRole.id,
          name: newRole.name,
          appType: newRole.appType,
        }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    // Return created role with permissions
    const created = await prisma.role.findUnique({
      where: { id: newRole.id },
      include: {
        permissions: true,
        parentRole: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Role '${newRole.name}' created successfully.`,
      role: created,
    });
  } catch (error) {
    console.error('[Create Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
