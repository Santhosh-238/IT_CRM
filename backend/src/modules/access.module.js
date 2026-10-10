/**
 * Access Control Module Definition & RBAC Schema
 */
export const ACCESS_MODULE = {
  id: 'access_control',
  name: 'Access Control',
  category: 'Administration',
  description: 'Role-Based Access Control, granular permission matrices, role hierarchy, and security audit logs.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
  defaultPermissions: {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canApprove: false,
  },
  // Schema specifications for roles and permissions
  schema: {
    role: {
      fields: ['id', 'name', 'slug', 'description', 'isSystem', 'appType', 'parentRoleId'],
      appTypes: ['admin', 'manager', 'sales', 'hr', 'field', 'employee'],
    },
    permission: {
      fields: ['id', 'roleId', 'moduleId', 'moduleName', 'category', 'canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
    },
    auditLog: {
      fields: ['id', 'userId', 'userName', 'action', 'targetType', 'targetName', 'details', 'ipAddress', 'createdAt'],
      actions: ['ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'ROLE_CLONED', 'USER_ROLE_ASSIGNED', 'BULK_ROLE_ASSIGNED'],
    },
  },
};

export default ACCESS_MODULE;
