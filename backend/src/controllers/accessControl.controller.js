import { prisma } from '../config/prisma.js';
import { delCacheByPattern } from '../config/redis.js';
import { SYSTEM_MODULES } from '../services/seedRBAC.js';
import { getUserPermissions } from '../middlewares/permission.middleware.js';

/**
 * 1. Get current authenticated user's permissions and role
 * GET /api/access-control/my-permissions
 */
export async function getMyPermissions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const permissionsData = await getUserPermissions(req.user);

    return res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      role: permissionsData?.role,
      permissions: permissionsData?.permissions || {},
      isSuperAdmin: Boolean(permissionsData?.isSuperAdmin),
    });
  } catch (error) {
    console.error('[Get My Permissions Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Get system modules list
 * GET /api/access-control/modules
 */
export async function getSystemModules(_req, res) {
  try {
    const modulesWithCategories = SYSTEM_MODULES.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      description: m.description,
    }));

    return res.json({
      success: true,
      modules: modulesWithCategories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Get all roles with permissions and user count
 * GET /api/access-control/roles
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
        userCount: role.users.length,
        users: role.users,
        activePermissionsCount,
        parentRole: role.parentRole,
        childRoles: role.childRoles,
        permissions: role.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    });

    return res.json({
      success: true,
      roles: formattedRoles,
    });
  } catch (error) {
    console.error('[Get Roles Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Get role by ID
 * GET /api/access-control/roles/:id
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
          select: { id: true, name: true, email: true, avatar: true },
        },
        parentRole: true,
        childRoles: true,
      },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    return res.json({ success: true, role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Create a new custom role
 * POST /api/access-control/roles
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

    await prisma.rolePermission.createMany({
      data: permissionsData,
    });

    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'ROLE_CREATED',
        targetType: 'Role',
        targetName: newRole.name,
        details: JSON.stringify({ roleId: newRole.id, slug: newRole.slug }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    const createdRoleWithPermissions = await prisma.role.findUnique({
      where: { id: newRole.id },
      include: { permissions: true },
    });

    return res.status(201).json({
      success: true,
      message: `Role '${newRole.name}' created successfully.`,
      role: createdRoleWithPermissions,
    });
  } catch (error) {
    console.error('[Create Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Update role metadata & granular permissions
 * PUT /api/access-control/roles/:id
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

    let updatedName = role.name;
    if (name && name.trim() && name.trim() !== role.name) {
      if (role.isSystem && role.slug === 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'System Super Admin role name cannot be modified.',
        });
      }
      updatedName = name.trim();
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: updatedName,
        description: description !== undefined ? description : role.description,
        appType: appType || role.appType,
        parentRoleId: parentRoleId !== undefined ? parentRoleId : role.parentRoleId,
      },
    });

    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        if (!p.moduleId) continue;
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

    try {
      await delCacheByPattern('crm:perms:*');
    } catch (e) {}

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
 * 7. Clone a role
 * POST /api/access-control/roles/:id/clone
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

/**
 * 8. Delete a custom role
 * DELETE /api/access-control/roles/:id
 */
export async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const { reassignToRoleId } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { users: { select: { id: true, name: true, email: true } } },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: `Protected system role '${role.name}' cannot be deleted.`,
      });
    }

    if (role.users.length > 0) {
      if (!reassignToRoleId) {
        return res.status(400).json({
          success: false,
          requiresReassignment: true,
          assignedUserCount: role.users.length,
          message: `Cannot delete '${role.name}' because ${role.users.length} user(s) are assigned to it.`,
        });
      }

      await prisma.user.updateMany({
        where: { roleId: id },
        data: { roleId: reassignToRoleId },
      });
    }

    await prisma.role.delete({ where: { id } });

    try {
      await delCacheByPattern('crm:perms:*');
    } catch (e) {}

    return res.json({
      success: true,
      message: `Role '${role.name}' was deleted successfully.`,
    });
  } catch (error) {
    console.error('[Delete Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 9. Get users with roles
 * GET /api/access-control/users
 */
export async function getUsersWithRoles(req, res) {
  try {
    const { search, roleId, department } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleId && roleId !== 'ALL') where.roleId = roleId;
    if (department && department !== 'ALL') where.department = department;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
        roleRelation: {
          select: { id: true, name: true, slug: true, isSystem: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 10. Assign user role
 * PATCH /api/access-control/users/:userId/role
 */
export async function assignUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!targetRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: targetRole.id,
        role: targetRole.slug.toUpperCase(),
      },
    });

    try {
      await delCacheByPattern('crm:perms:*');
      await delCacheByPattern('crm:session:*');
    } catch (e) {}

    return res.json({
      success: true,
      message: `Role updated to '${targetRole.name}'`,
      user: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 11. Bulk assign user roles
 * POST /api/access-control/users/bulk-role
 */
export async function bulkAssignUserRoles(req, res) {
  try {
    const { userIds, roleId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !roleId) {
      return res.status(400).json({ success: false, message: 'userIds and roleId are required.' });
    }

    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!targetRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        roleId: targetRole.id,
        role: targetRole.slug.toUpperCase(),
      },
    });

    try {
      await delCacheByPattern('crm:perms:*');
      await delCacheByPattern('crm:session:*');
    } catch (e) {}

    return res.json({
      success: true,
      message: `Successfully assigned ${userIds.length} users to '${targetRole.name}'.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 12. Get Audit logs
 * GET /api/access-control/audit-logs
 */
export async function getAuditLogs(req, res) {
  try {
    const { action, targetType, page = 1, limit = 50 } = req.query;
    const where = {};
    if (action && action !== 'ALL') where.action = action;
    if (targetType && targetType !== 'ALL') where.targetType = targetType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.accessAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.accessAuditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  getMyPermissions,
  getSystemModules,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  cloneRole,
  deleteRole,
  getUsersWithRoles,
  assignUserRole,
  bulkAssignUserRoles,
  getAuditLogs,
};
