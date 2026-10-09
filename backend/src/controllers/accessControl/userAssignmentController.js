import { prisma } from '../../config/prisma.js';
import { delCache, delCacheByPattern } from '../../config/redis.js';

/**
 * List all users with role assignments and search/filter
 */
export async function getUsersWithRoles(req, res) {
  try {
    const { search, roleId, department, page = 1, limit = 50 } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId && roleId !== 'ALL') {
      where.roleId = roleId;
    }

    if (department && department !== 'ALL') {
      where.department = department;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          department: true,
          role: true,
          roleId: true,
          roleRelation: {
            select: {
              id: true,
              name: true,
              slug: true,
              isSystem: true,
              appType: true,
              parentRoleId: true,
              parentRole: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ name: 'asc' }],
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    // Also get list of departments for filters
    const departments = await prisma.user.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ['department'],
    });

    return res.json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      departments: departments.map((d) => d.department).filter(Boolean),
    });
  } catch (error) {
    console.error('[Get Users With Roles Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Assign / Reassign a role to an individual user
 */
export async function assignUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ success: false, message: 'Role ID is required.' });
    }

    const [user, targetRole] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { roleRelation: true } }),
      prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!targetRole) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    const previousRoleName = user.roleRelation?.name || user.role || 'Unassigned';

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: targetRole.id,
        role: targetRole.slug.toUpperCase(),
      },
      include: {
        roleRelation: {
          select: {
            id: true,
            name: true,
            slug: true,
            isSystem: true,
            appType: true,
          },
        },
      },
    });

    // Invalidate user caches
    try {
      await delCache(`crm:perms:${userId}`);
      await delCache(`crm:session:${userId}`);
    } catch (e) {}

    // Audit log
    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'USER_ROLE_REASSIGNED',
        targetType: 'User',
        targetName: user.name,
        details: JSON.stringify({
          userId,
          userEmail: user.email,
          previousRole: previousRoleName,
          newRole: targetRole.name,
        }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    return res.json({
      success: true,
      message: `Role for ${user.name} successfully updated to '${targetRole.name}'.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Assign User Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Bulk assign roles to multiple users at once
 */
export async function bulkAssignUserRoles(req, res) {
  try {
    const { userIds, roleId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of userIds is required.' });
    }

    if (!roleId) {
      return res.status(400).json({ success: false, message: 'Target roleId is required.' });
    }

    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!targetRole) {
      return res.status(404).json({ success: false, message: 'Target role not found.' });
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        roleId: targetRole.id,
        role: targetRole.slug.toUpperCase(),
      },
    });

    // Invalidate all permissions caches
    try {
      await delCacheByPattern('crm:perms:*');
      await delCacheByPattern('crm:session:*');
    } catch (e) {}

    // Audit log
    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'BULK_USER_ROLE_ASSIGNED',
        targetType: 'User',
        targetName: `${userIds.length} Users`,
        details: JSON.stringify({
          userIdsCount: userIds.length,
          newRole: targetRole.name,
        }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    return res.json({
      success: true,
      message: `Successfully assigned ${userIds.length} user(s) to '${targetRole.name}'.`,
    });
  } catch (error) {
    console.error('[Bulk Assign User Roles Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
