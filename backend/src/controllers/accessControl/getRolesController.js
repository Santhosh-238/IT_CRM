import { prisma } from '../../config/prisma.js';
import { SYSTEM_MODULES } from '../../services/seedRBAC.js';

/**
 * Get all roles with permission count and user count
 */
export async function getRoles(req, res) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          orderBy: [{ category: 'asc' }, { moduleId: 'asc' }],
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        parentRole: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        childRoles: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    // Compute stats
    const formattedRoles = roles.map((role) => {
      const activePermissionsCount = role.permissions.reduce((count, p) => {
        let active = 0;
        if (p.canView) active++;
        if (p.canCreate) active++;
        if (p.canEdit) active++;
        if (p.canDelete) active++;
        if (p.canExport) active++;
        if (p.canApprove) active++;
        return count + active;
      }, 0);

      return {
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: role.isSystem,
        appType: role.appType,
        parentRoleId: role.parentRoleId,
        parentRole: role.parentRole,
        childRoles: role.childRoles,
        userCount: role.users.length,
        users: role.users,
        permissionsCount: activePermissionsCount,
        totalPossiblePermissions: role.permissions.length * 6,
        permissions: role.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    });

    return res.json({
      success: true,
      roles: formattedRoles,
      systemModules: SYSTEM_MODULES,
      totalRoles: roles.length,
    });
  } catch (error) {
    console.error('[Get Roles Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get single role details with full permission matrix
 */
export async function getRoleById(req, res) {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          orderBy: [{ category: 'asc' }, { moduleId: 'asc' }],
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        parentRole: true,
        childRoles: true,
      },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    return res.json({
      success: true,
      role,
      systemModules: SYSTEM_MODULES,
    });
  } catch (error) {
    console.error('[Get Role By ID Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get system modules metadata catalogue
 */
export async function getSystemModules(_req, res) {
  return res.json({
    success: true,
    modules: SYSTEM_MODULES,
  });
}
