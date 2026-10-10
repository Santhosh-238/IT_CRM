import * as accessControlService from '../services/accessControl.service.js';

/**
 * 1. Get current authenticated user's permissions and role
 * GET /api/access-control/my-permissions
 */
export async function getMyPermissions(req, res) {
  try {
    const data = await accessControlService.getMyPermissionsService(req.user);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[Get My Permissions Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error fetching permissions',
    });
  }
}

/**
 * 2. Get system modules list
 * GET /api/access-control/modules
 */
export async function getSystemModules(_req, res) {
  try {
    const data = await accessControlService.getSystemModulesService();
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 3. Get all roles with permissions and user count
 * GET /api/access-control/roles
 */
export async function getRoles(_req, res) {
  try {
    const data = await accessControlService.getRolesService();
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[Get Roles Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 4. Get role by ID
 * GET /api/access-control/roles/:id
 */
export async function getRoleById(req, res) {
  try {
    const data = await accessControlService.getRoleByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 5. Create a new custom role
 * POST /api/access-control/roles
 */
export async function createRole(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const data = await accessControlService.createRoleService(req.body, req.user, ip);
    return res.status(201).json({
      success: true,
      message: `Role '${data.role.name}' created successfully.`,
      role: data.role,
    });
  } catch (error) {
    console.error('[Create Role Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 6. Update role metadata & granular permissions
 * PUT /api/access-control/roles/:id
 */
export async function updateRole(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const data = await accessControlService.updateRoleService(req.params.id, req.body, req.user, ip);
    return res.status(200).json({
      success: true,
      message: `Role '${data.role.name}' permissions updated successfully.`,
      role: data.role,
    });
  } catch (error) {
    console.error('[Update Role Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 7. Clone a role
 * POST /api/access-control/roles/:id/clone
 */
export async function cloneRole(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const data = await accessControlService.cloneRoleService(req.params.id, req.body, req.user, ip);
    return res.status(201).json({
      success: true,
      message: `Role cloned successfully as '${data.role.name}'.`,
      role: data.role,
    });
  } catch (error) {
    console.error('[Clone Role Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 8. Delete a custom role
 * DELETE /api/access-control/roles/:id
 */
export async function deleteRole(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await accessControlService.deleteRoleService(
      req.params.id,
      req.body?.reassignToRoleId,
      req.user,
      ip
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Delete Role Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
      ...(error.requiresReassignment && {
        requiresReassignment: error.requiresReassignment,
        assignedUserCount: error.assignedUserCount,
      }),
    });
  }
}

/**
 * 9. Get users with roles
 * GET /api/access-control/users
 */
export async function getUsersWithRoles(req, res) {
  try {
    const data = await accessControlService.getUsersWithRolesService(req.query);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 10. Assign user role
 * PATCH /api/access-control/users/:userId/role
 */
export async function assignUserRole(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const data = await accessControlService.assignUserRoleService(
      req.params.userId,
      req.body?.roleId,
      req.user,
      ip
    );
    return res.status(200).json({
      success: true,
      message: `Role updated to '${data.roleName}'`,
      user: data.user,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 11. Bulk assign user roles
 * POST /api/access-control/users/bulk-role
 */
export async function bulkAssignUserRoles(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const data = await accessControlService.bulkAssignUserRolesService(
      req.body?.userIds,
      req.body?.roleId,
      req.user,
      ip
    );
    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${data.count} users to '${data.roleName}'.`,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * 12. Get Audit logs
 * GET /api/access-control/audit-logs
 */
export async function getAuditLogs(req, res) {
  try {
    const data = await accessControlService.getAuditLogsService(req.query);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
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
