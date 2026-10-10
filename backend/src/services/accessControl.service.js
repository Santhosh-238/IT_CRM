import { prisma } from '../config/prisma.js';
import { delCacheByPattern } from '../config/redis.js';
import { SYSTEM_MODULES } from '../modules/module.registry.js';
import { getUserPermissions } from '../middlewares/permission.middleware.js';
import {
  generateRoleSlug,
  formatRoleResponse,
  logAccessAudit,
} from '../utils/accessControl.util.js';

/**
 * 1. Get current authenticated user's permissions and role
 */
export async function getMyPermissionsService(user) {
  if (!user) {
    throw { status: 401, message: 'Not authenticated.' };
  }

  const permissionsData = await getUserPermissions(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    role: permissionsData?.role,
    permissions: permissionsData?.permissions || {},
    isSuperAdmin: Boolean(permissionsData?.isSuperAdmin),
  };
}

/**
 * 2. Get system modules list
 */
export async function getSystemModulesService() {
  const modulesWithCategories = SYSTEM_MODULES.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    description: m.description,
  }));

  return { modules: modulesWithCategories };
}

/**
 * 3. Get all roles with permissions and user count
 */
export async function getRolesService() {
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

  const formattedRoles = roles.map(formatRoleResponse);
  return { roles: formattedRoles };
}

/**
 * 4. Get role by ID
 */
export async function getRoleByIdService(id) {
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
    throw { status: 404, message: 'Role not found' };
  }

  return { role: formatRoleResponse(role) };
}

/**
 * 5. Create a new custom role
 */
export async function createRoleService(data, currentUser = null, ipAddress = '127.0.0.1') {
  const { name, description, appType, parentRoleId, permissions } = data;

  if (!name || !name.trim()) {
    throw { status: 400, message: 'Role name is required' };
  }

  const cleanName = name.trim();
  const slug = generateRoleSlug(cleanName);

  const existingRole = await prisma.role.findFirst({
    where: {
      OR: [{ name: { equals: cleanName, mode: 'insensitive' } }, { slug }],
    },
  });

  if (existingRole) {
    throw { status: 400, message: `A role with the name '${cleanName}' already exists.` };
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

  await logAccessAudit({
    userId: currentUser?.id || null,
    userName: currentUser?.name || 'System Admin',
    action: 'ROLE_CREATED',
    targetType: 'Role',
    targetName: newRole.name,
    details: { roleId: newRole.id, slug: newRole.slug },
    ipAddress,
  });

  const createdRoleWithPermissions = await prisma.role.findUnique({
    where: { id: newRole.id },
    include: { permissions: true, users: true },
  });

  return { role: formatRoleResponse(createdRoleWithPermissions) };
}

/**
 * 6. Update role metadata & granular permissions
 */
export async function updateRoleService(id, data, currentUser = null, ipAddress = '127.0.0.1') {
  const { name, description, appType, parentRoleId, permissions } = data;

  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true },
  });

  if (!role) {
    throw { status: 404, message: 'Role not found' };
  }

  let updatedName = role.name;
  if (name && name.trim() && name.trim() !== role.name) {
    if (role.isSystem && role.slug === 'super_admin') {
      throw { status: 400, message: 'System Super Admin role name cannot be modified.' };
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

  await logAccessAudit({
    userId: currentUser?.id || null,
    userName: currentUser?.name || 'System Admin',
    action: 'ROLE_UPDATED',
    targetType: 'Role',
    targetName: updatedRole.name,
    details: { roleId: updatedRole.id, name: updatedRole.name },
    ipAddress,
  });

  const fullUpdatedRole = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { orderBy: [{ category: 'asc' }, { moduleId: 'asc' }] },
      parentRole: true,
      users: true,
    },
  });

  return { role: formatRoleResponse(fullUpdatedRole) };
}

/**
 * 7. Clone a role
 */
export async function cloneRoleService(id, data, currentUser = null, ipAddress = '127.0.0.1') {
  const { newName, description } = data;

  const sourceRole = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true },
  });

  if (!sourceRole) {
    throw { status: 404, message: 'Source role not found' };
  }

  const cleanName = (newName || `${sourceRole.name} (Copy)`).trim();
  const slug = generateRoleSlug(cleanName);

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

  await logAccessAudit({
    userId: currentUser?.id || null,
    userName: currentUser?.name || 'System Admin',
    action: 'ROLE_CLONED',
    targetType: 'Role',
    targetName: clonedRole.name,
    details: { sourceRoleId: sourceRole.id, clonedRoleId: clonedRole.id },
    ipAddress,
  });

  const result = await prisma.role.findUnique({
    where: { id: clonedRole.id },
    include: { permissions: true, parentRole: true, users: true },
  });

  return { role: formatRoleResponse(result) };
}

/**
 * 8. Delete a custom role
 */
export async function deleteRoleService(id, reassignToRoleId, currentUser = null, ipAddress = '127.0.0.1') {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { users: { select: { id: true, name: true, email: true } } },
  });

  if (!role) {
    throw { status: 404, message: 'Role not found' };
  }

  if (role.isSystem) {
    throw { status: 400, message: `Protected system role '${role.name}' cannot be deleted.` };
  }

  if (role.users.length > 0) {
    if (!reassignToRoleId) {
      throw {
        status: 400,
        requiresReassignment: true,
        assignedUserCount: role.users.length,
        message: `Cannot delete '${role.name}' because ${role.users.length} user(s) are assigned to it.`,
      };
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

  await logAccessAudit({
    userId: currentUser?.id || null,
    userName: currentUser?.name || 'System Admin',
    action: 'ROLE_DELETED',
    targetType: 'Role',
    targetName: role.name,
    details: { roleId: id, reassignToRoleId },
    ipAddress,
  });

  return { success: true, message: `Role '${role.name}' was deleted successfully.` };
}

/**
 * 9. Get users with roles
 */
export async function getUsersWithRolesService(query = {}) {
  const { search, roleId, department } = query;
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

  return { count: users.length, users };
}

/**
 * 10. Assign user role
 */
export async function assignUserRoleService(userId, roleId, currentUser = null, ipAddress = '127.0.0.1') {
  const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!targetRole) {
    throw { status: 404, message: 'Role not found' };
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

  await logAccessAudit({
    userId: currentUser?.id || null,
    userName: currentUser?.name || 'System Admin',
    action: 'USER_ROLE_ASSIGNED',
    targetType: 'User',
    targetName: updated.name,
    details: { userId, roleId: targetRole.id, roleName: targetRole.name },
    ipAddress,
  });

  return { user: updated, roleName: targetRole.name };
}

/**
 * 11. Bulk assign user roles
 */
export async function bulkAssignUserRolesService(userIds, roleId, currentUser = null, ipAddress = '127.0.0.1') {
  if (!Array.isArray(userIds) || userIds.length === 0 || !roleId) {
    throw { status: 400, message: 'userIds and roleId are required.' };
  }

  const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!targetRole) {
    throw { status: 404, message: 'Role not found' };
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

  await logAccessAudit({
    userId: currentUser?.id || null,
    userName: currentUser?.name || 'System Admin',
    action: 'BULK_ROLE_ASSIGNED',
    targetType: 'User',
    targetName: `${userIds.length} users`,
    details: { userIds, roleId: targetRole.id, roleName: targetRole.name },
    ipAddress,
  });

  return { count: userIds.length, roleName: targetRole.name };
}

/**
 * 12. Get Audit logs
 */
export async function getAuditLogsService(query = {}) {
  const { action, targetType, page = 1, limit = 50 } = query;
  const where = {};
  if (action && action !== 'ALL') where.action = action;
  if (targetType && targetType !== 'ALL') where.targetType = targetType;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    prisma.accessAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.accessAuditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export default {
  getMyPermissionsService,
  getSystemModulesService,
  getRolesService,
  getRoleByIdService,
  createRoleService,
  updateRoleService,
  cloneRoleService,
  deleteRoleService,
  getUsersWithRolesService,
  assignUserRoleService,
  bulkAssignUserRolesService,
  getAuditLogsService,
};
