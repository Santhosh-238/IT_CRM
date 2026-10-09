import { prisma } from '../../config/prisma.js';
import { delCacheByPattern } from '../../config/redis.js';

/**
 * Update role metadata & granular permissions matrix
 */
export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, description, appType, parentRoleId, permissions } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Role name update check (System roles cannot change their fundamental name/slug)
    let updatedName = role.name;
    if (name && name.trim() && name.trim() !== role.name) {
      if (role.isSystem && role.slug === 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'System Super Admin role name cannot be modified.',
        });
      }

      const cleanName = name.trim();
      const existing = await prisma.role.findFirst({
        where: {
          id: { not: id },
          name: { equals: cleanName, mode: 'insensitive' },
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A role named '${cleanName}' already exists.`,
        });
      }
      updatedName = cleanName;
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: updatedName,
        description: description !== undefined ? description : role.description,
        appType: appType || role.appType,
        parentRoleId: parentRoleId !== undefined ? parentRoleId : role.parentRoleId,
      },
    });

    // Update permissions matrix if provided
    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        if (!p.moduleId) continue;

        // Prevent stripping Super Admin of all permissions
        const isSuperAdmin = role.slug === 'super_admin';

        await prisma.rolePermission.upsert({
          where: {
            roleId_moduleId: {
              roleId: id,
              moduleId: p.moduleId,
            },
          },
          update: {
            canView: isSuperAdmin ? true : Boolean(p.canView),
            canCreate: isSuperAdmin ? true : Boolean(p.canCreate),
            canEdit: isSuperAdmin ? true : Boolean(p.canEdit),
            canDelete: isSuperAdmin ? true : Boolean(p.canDelete),
            canExport: isSuperAdmin ? true : Boolean(p.canExport),
            canApprove: isSuperAdmin ? true : Boolean(p.canApprove),
          },
          create: {
            roleId: id,
            moduleId: p.moduleId,
            moduleName: p.moduleName || p.moduleId,
            category: p.category || 'Core',
            canView: isSuperAdmin ? true : Boolean(p.canView),
            canCreate: isSuperAdmin ? true : Boolean(p.canCreate),
            canEdit: isSuperAdmin ? true : Boolean(p.canEdit),
            canDelete: isSuperAdmin ? true : Boolean(p.canDelete),
            canExport: isSuperAdmin ? true : Boolean(p.canExport),
            canApprove: isSuperAdmin ? true : Boolean(p.canApprove),
          },
        });
      }
    }

    // Invalidate Redis permissions cache for all users
    try {
      await delCacheByPattern('crm:perms:*');
    } catch (e) {}

    // Audit log
    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'PERMISSIONS_UPDATED',
        targetType: 'Role',
        targetName: updatedRole.name,
        details: JSON.stringify({
          roleId: id,
          updatedPermissionsCount: permissions?.length || 0,
        }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    const fullUpdatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { orderBy: [{ category: 'asc' }, { moduleId: 'asc' }] },
        parentRole: true,
      },
    });

    return res.json({
      success: true,
      message: `Role '${fullUpdatedRole.name}' permissions updated successfully.`,
      role: fullUpdatedRole,
    });
  } catch (error) {
    console.error('[Update Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Clone an existing role with all its permissions
 */
export async function cloneRole(req, res) {
  try {
    const { id } = req.params;
    const { newName, description } = req.body;

    const sourceRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!sourceRole) {
      return res.status(404).json({ success: false, message: 'Source role not found' });
    }

    const cleanName = (newName || `${sourceRole.name} (Copy)`).trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const existing = await prisma.role.findFirst({
      where: {
        OR: [{ name: { equals: cleanName, mode: 'insensitive' } }, { slug }],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A role with name '${cleanName}' already exists.`,
      });
    }

    // Create cloned role
    const clonedRole = await prisma.role.create({
      data: {
        name: cleanName,
        slug,
        description: description || `Cloned from ${sourceRole.name}`,
        appType: sourceRole.appType,
        parentRoleId: sourceRole.parentRoleId,
        isSystem: false,
      },
    });

    // Copy all permissions
    for (const p of sourceRole.permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: clonedRole.id,
          moduleId: p.moduleId,
          moduleName: p.moduleName,
          category: p.category,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
          canExport: p.canExport,
          canApprove: p.canApprove,
        },
      });
    }

    // Audit log
    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'ROLE_CLONED',
        targetType: 'Role',
        targetName: clonedRole.name,
        details: JSON.stringify({
          clonedFrom: sourceRole.name,
          newRoleId: clonedRole.id,
        }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    const result = await prisma.role.findUnique({
      where: { id: clonedRole.id },
      include: { permissions: true, parentRole: true },
    });

    return res.status(201).json({
      success: true,
      message: `Role cloned successfully as '${clonedRole.name}'.`,
      role: result,
    });
  } catch (error) {
    console.error('[Clone Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
