import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
  SystemModule,
  UserWithRole,
  AccessAuditLog,
  RoleFormData,
  MyPermissionsResponse,
  PermissionAction,
} from '../types/accessControl';
import { accessControlService } from '../services/accessControlService';

interface AccessControlContextType {
  roles: Role[];
  selectedRole: Role | null;
  setSelectedRole: (role: Role | null) => void;
  systemModules: SystemModule[];
  users: UserWithRole[];
  auditLogs: AccessAuditLog[];
  myPermissions: MyPermissionsResponse | null;
  isSuperAdmin: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Permission Checker Functions
  can: (moduleId: string, action?: PermissionAction) => boolean;
  canView: (moduleId: string) => boolean;
  canCreate: (moduleId: string) => boolean;
  canEdit: (moduleId: string) => boolean;
  canDelete: (moduleId: string) => boolean;
  canExport: (moduleId: string) => boolean;
  canApprove: (moduleId: string) => boolean;

  // CRUD & Management Actions
  fetchRoles: () => Promise<void>;
  fetchUsers: (params?: { search?: string; roleId?: string; department?: string }) => Promise<void>;
  fetchAuditLogs: (params?: { action?: string; targetType?: string }) => Promise<void>;
  fetchMyPermissions: () => Promise<void>;
  createRole: (data: RoleFormData) => Promise<{ success: boolean; role?: Role; message?: string }>;
  updateRole: (id: string, data: Partial<RoleFormData>) => Promise<{ success: boolean; role?: Role; message?: string }>;
  cloneRole: (id: string, newName: string, description?: string) => Promise<{ success: boolean; role?: Role; message?: string }>;
  deleteRole: (
    id: string,
    reassignToRoleId?: string
  ) => Promise<{ success: boolean; message?: string; requiresReassignment?: boolean; assignedUserCount?: number }>;
  assignUserRole: (userId: string, roleId: string) => Promise<{ success: boolean; message?: string }>;
  bulkAssignUserRoles: (userIds: string[], roleId: string) => Promise<{ success: boolean; message?: string }>;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export const AccessControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [systemModules, setSystemModules] = useState<SystemModule[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AccessAuditLog[]>([]);
  const [myPermissions, setMyPermissions] = useState<MyPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch My Permissions
  const fetchMyPermissions = useCallback(async () => {
    const res = await accessControlService.getMyPermissions();
    if (res.success && res.data) {
      setMyPermissions(res.data);
    }
  }, []);

  // 2. Fetch Roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await accessControlService.getRoles();
    if (res.success && res.roles) {
      setRoles(res.roles);
      if (res.systemModules) {
        setSystemModules(res.systemModules);
      }
      setSelectedRole((prev) => {
        if (prev) {
          const matched = res.roles!.find((r) => r.id === prev.id);
          return matched || res.roles![0] || null;
        }
        return res.roles![0] || null;
      });
    } else {
      setError(res.message || 'Failed to fetch roles');
    }
    setLoading(false);
  }, []);

  // 3. Fetch Users
  const fetchUsers = useCallback(
    async (params?: { search?: string; roleId?: string; department?: string }) => {
      const res = await accessControlService.getUsers(params);
      if (res.success && res.users) {
        setUsers(res.users);
      }
    },
    []
  );

  // 4. Fetch Audit Logs
  const fetchAuditLogs = useCallback(
    async (params?: { action?: string; targetType?: string }) => {
      const res = await accessControlService.getAuditLogs(params);
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    },
    []
  );

  useEffect(() => {
    fetchMyPermissions();
    fetchRoles();
    fetchUsers();
    fetchAuditLogs();
  }, [fetchMyPermissions, fetchRoles, fetchUsers, fetchAuditLogs]);

  // Permission Checkers
  const isSuperAdmin = Boolean(
    myPermissions?.isSuperAdmin ||
      myPermissions?.role?.slug === 'super_admin' ||
      myPermissions?.user?.role === 'SUPER_ADMIN'
  );

  const can = useCallback(
    (moduleId: string, action: PermissionAction = 'view'): boolean => {
      if (isSuperAdmin) return true;
      if (!myPermissions?.permissions) return true; // Fail-open in dev mode
      const modulePerms = myPermissions.permissions[moduleId];
      if (!modulePerms) return false;
      return Boolean(modulePerms[action]);
    },
    [isSuperAdmin, myPermissions]
  );

  const canView = useCallback((moduleId: string) => can(moduleId, 'view'), [can]);
  const canCreate = useCallback((moduleId: string) => can(moduleId, 'create'), [can]);
  const canEdit = useCallback((moduleId: string) => can(moduleId, 'edit'), [can]);
  const canDelete = useCallback((moduleId: string) => can(moduleId, 'delete'), [can]);
  const canExport = useCallback((moduleId: string) => can(moduleId, 'export'), [can]);
  const canApprove = useCallback((moduleId: string) => can(moduleId, 'approve'), [can]);

  // Actions
  const createRole = async (data: RoleFormData) => {
    setSaving(true);
    const res = await accessControlService.createRole(data);
    setSaving(false);
    if (res.success && res.role) {
      await fetchRoles();
      setSelectedRole(res.role);
    }
    return res;
  };

  const updateRole = async (id: string, data: Partial<RoleFormData>) => {
    setSaving(true);
    const res = await accessControlService.updateRole(id, data);
    setSaving(false);
    if (res.success && res.role) {
      await fetchRoles();
      setSelectedRole(res.role);
      await fetchMyPermissions();
    }
    return res;
  };

  const cloneRole = async (id: string, newName: string, description?: string) => {
    setSaving(true);
    const res = await accessControlService.cloneRole(id, newName, description);
    setSaving(false);
    if (res.success && res.role) {
      await fetchRoles();
      setSelectedRole(res.role);
    }
    return res;
  };

  const deleteRole = async (id: string, reassignToRoleId?: string) => {
    setSaving(true);
    const res = await accessControlService.deleteRole(id, reassignToRoleId);
    setSaving(false);
    if (res.success) {
      await fetchRoles();
      await fetchUsers();
    }
    return res;
  };

  const assignUserRole = async (userId: string, roleId: string) => {
    setSaving(true);
    const res = await accessControlService.assignUserRole(userId, roleId);
    setSaving(false);
    if (res.success) {
      await fetchUsers();
      await fetchRoles();
    }
    return res;
  };

  const bulkAssignUserRoles = async (userIds: string[], roleId: string) => {
    setSaving(true);
    const res = await accessControlService.bulkAssignUserRoles(userIds, roleId);
    setSaving(false);
    if (res.success) {
      await fetchUsers();
      await fetchRoles();
    }
    return res;
  };

  return (
    <AccessControlContext.Provider
      value={{
        roles,
        selectedRole,
        setSelectedRole,
        systemModules,
        users,
        auditLogs,
        myPermissions,
        isSuperAdmin,
        loading,
        saving,
        error,
        can,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canExport,
        canApprove,
        fetchRoles,
        fetchUsers,
        fetchAuditLogs,
        fetchMyPermissions,
        createRole,
        updateRole,
        cloneRole,
        deleteRole,
        assignUserRole,
        bulkAssignUserRoles,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};

export const usePermissions = () => {
  const {
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canApprove,
    isSuperAdmin,
    myPermissions,
  } = useAccessControl();

  return {
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canApprove,
    isSuperAdmin,
    myPermissions,
  };
};

export default AccessControlContext;
