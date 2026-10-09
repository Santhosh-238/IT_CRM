import { prisma } from '../../config/prisma.js';
import { delCacheByPattern } from '../../config/redis.js';

/**
 * Delete a custom role
 */
export async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const { reassignToRoleId } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
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

    // Check if users are assigned to this role
    if (role.users.length > 0) {
      if (!reassignToRoleId) {
        return res.status(400).json({
          success: false,
          requiresReassignment: true,
          assignedUserCount: role.users.length,
          message: `Cannot delete '${role.name}' because ${role.users.length} user(s) are currently assigned to it. Please choose a role to reassign them to.`,
        });
      }

      const targetRole = await prisma.role.findUnique({
        where: { id: reassignToRoleId },
      });

      if (!targetRole) {
        return res.status(400).json({
          success: false,
          message: 'Target role for reassignment was not found.',
        });
      }

      // Reassign users to target role
      await prisma.user.updateMany({
        where: { roleId: id },
        data: {
          roleId: targetRole.id,
          role: targetRole.slug.toUpperCase(),
        },
      });
    }

    // Delete role (RolePermissions are cascaded via schema)
    await prisma.role.delete({
      where: { id },
    });

    // Invalidate Redis permissions cache
    try {
      await delCacheByPattern('crm:perms:*');
    } catch (e) {}

    // Audit log
    await prisma.accessAuditLog.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || 'System Admin',
        action: 'ROLE_DELETED',
        targetType: 'Role',
        targetName: role.name,
        details: JSON.stringify({
          roleId: id,
          deletedRoleName: role.name,
          reassignedUsersCount: role.users.length,
        }),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    return res.json({
      success: true,
      message: `Role '${role.name}' was deleted successfully.`,
    });
  } catch (error) {
    console.error('[Delete Role Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
