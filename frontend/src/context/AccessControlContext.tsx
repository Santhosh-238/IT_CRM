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
import { useCRM } from './CRMContext';

interface AccessControlContextType {
  roles: Role[];
  selectedRole: Role | null;
  setSelectedRole: (role: Role | null) => void;
  systemModules: SystemModule[];
  users: UserWithRole[];
  auditLogs: AccessAuditLog[];
  myPermissions: MyPermissionsResponse | null;
  permissionsLoaded: boolean;
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
  createModule: (data: { name: string; category?: string; description?: string }) => Promise<{ success: boolean; module?: SystemModule; message?: string }>;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

const DEFAULT_SYSTEM_MODULES: SystemModule[] = [
  // 1. Main Navigation
  { id: 'dashboard', name: 'Dashboard', category: 'Main Navigation', description: 'Executive analytics, revenue, KPIs, and overview charts.' },
  { id: 'employee_management', name: 'Employee Management', category: 'Main Navigation', description: 'Staff directory, onboarding, designations, and employee records.' },
  { id: 'contacts', name: 'Contacts', category: 'Main Navigation', description: 'Customer profiles, contact details, and account ownership.' },
  { id: 'leads', name: 'Leads', category: 'Main Navigation', description: 'Prospect pipeline, lead stages, and qualification workflows.' },
  { id: 'scheduled_meetings', name: 'Scheduled Meetings', category: 'Main Navigation', description: 'Date-wise scheduled client and team meetings, employee creator tracking, and timings.' },
  { id: 'call_logs', name: 'Call Logs', category: 'Main Navigation', description: 'Telephony records, call durations, notes, and follow-ups.' },
  { id: 'customers', name: 'Customers', category: 'Main Navigation', description: 'Client company directories, accounts, and relationship history.' },
  { id: 'projects', name: 'Projects Management', category: 'Main Navigation', description: 'Client project delivery, sprints, milestones, and task SLAs.' },
  { id: 'negotiations', name: 'Negotiations', category: 'Main Navigation', description: 'Commercial terms, pricing discussions, discounts, and client follow-ups.' },

  // 2. Administration & Security
  { id: 'access_control', name: 'Access Control & RBAC', category: 'Administration & Security', description: 'Role-Based Access Control, permissions matrix, and role hierarchy.' },
];

export const AccessControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useCRM();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [systemModules, setSystemModules] = useState<SystemModule[]>(DEFAULT_SYSTEM_MODULES);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AccessAuditLog[]>([]);
  const [myPermissions, setMyPermissions] = useState<MyPermissionsResponse | null>(() => {
    try {
      const saved = localStorage.getItem('crm_my_permissions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('crm_my_permissions'));
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch My Permissions
  const fetchMyPermissions = useCallback(async () => {
    try {
      const res = await accessControlService.getMyPermissions();
      if (res.success && res.data) {
        setMyPermissions(res.data);
        setPermissionsLoaded(true);
        try {
          localStorage.setItem('crm_my_permissions', JSON.stringify(res.data));
        } catch {}
      }
    } catch {
      setPermissionsLoaded(true);
    }
  }, []);

  // 2. Fetch Roles & Modules
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [rolesRes, modulesRes] = await Promise.all([
      accessControlService.getRoles(),
      accessControlService.getModules(),
    ]);

    // Populate system modules
    if (modulesRes.success && modulesRes.modules && modulesRes.modules.length > 0) {
      setSystemModules(modulesRes.modules);
    } else if (rolesRes.success && rolesRes.systemModules && rolesRes.systemModules.length > 0) {
      setSystemModules(rolesRes.systemModules);
    }

    if (rolesRes.success && rolesRes.roles) {
      setRoles(rolesRes.roles);
      setSelectedRole((prev) => {
        if (prev) {
          const matched = rolesRes.roles!.find((r) => r.id === prev.id);
          return matched || rolesRes.roles![0] || null;
        }
        return rolesRes.roles![0] || null;
      });
    } else {
      setError(rolesRes.message || 'Failed to fetch roles');
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
  }, [fetchMyPermissions, fetchRoles, fetchUsers, fetchAuditLogs, currentUser?.id]);

  useEffect(() => {
    const handlePermsUpdated = () => {
      fetchMyPermissions();
      fetchRoles();
    };
    window.addEventListener('crm_permissions_updated', handlePermsUpdated);
    return () => {
      window.removeEventListener('crm_permissions_updated', handlePermsUpdated);
    };
  }, [fetchMyPermissions, fetchRoles]);

  // Permission Checkers
  const roleSlugStr = (myPermissions?.role?.slug || myPermissions?.role?.name || currentUser?.role || '').toLowerCase().trim();

  // True Super Admin gets bypass from verified server permissions, user profile or sandy@gmail.com
  const isSuperAdmin = Boolean(
    myPermissions?.isSuperAdmin ||
      roleSlugStr === 'super_admin' ||
      currentUser?.role === 'SUPER_ADMIN' ||
      (currentUser?.email && currentUser.email.toLowerCase() === 'sandy@gmail.com')
  );

  const can = useCallback(
    (moduleId: string, action: PermissionAction = 'view'): boolean => {
      if (isSuperAdmin) return true;
      // If permissions are not yet loaded and no cache exists, do not block or flip screen during initial render
      if (!myPermissions?.permissions) {
        return !permissionsLoaded;
      }

      // Alias mapping between sidebar IDs, route names, and DB keys
      const normalizeMap: Record<string, string[]> = {
        dashboard: ['dashboard'],
        employee_management: ['employee_management', 'employees'],
        employees: ['employees', 'employee_management'],
        contacts: ['contacts'],
        leads: ['leads'],
        scheduled_meetings: ['scheduled_meetings', 'meetings'],
        meetings: ['meetings', 'scheduled_meetings'],
        call_logs: ['call_logs', 'calls'],
        calls: ['calls', 'call_logs'],
        customers: ['customers', 'companies'],
        companies: ['companies', 'customers'],
        projects: ['projects', 'projects_management'],
        projects_management: ['projects_management', 'projects'],
        access_control: ['access_control', 'rbac'],
        rbac: ['rbac', 'access_control'],
      };

      const candidates = normalizeMap[moduleId] || [moduleId];
      for (const key of candidates) {
        const p = myPermissions.permissions[key];
        if (p) {
          const val =
            action === 'view'
              ? (p.view !== undefined ? p.view : (p as any).canView)
              : action === 'create'
              ? (p.create !== undefined ? p.create : (p as any).canCreate)
              : action === 'edit'
              ? (p.edit !== undefined ? p.edit : (p as any).canEdit)
              : action === 'delete'
              ? (p.delete !== undefined ? p.delete : (p as any).canDelete)
              : action === 'export'
              ? (p.export !== undefined ? p.export : (p as any).canExport)
              : action === 'approve'
              ? (p.approve !== undefined ? p.approve : (p as any).canApprove)
              : (p as any)[action];

          return Boolean(val);
        }
      }
      return false;
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

  const createModule = async (data: { name: string; category?: string; description?: string }) => {
    setSaving(true);
    const res = await accessControlService.createModule(data);
    setSaving(false);
    if (res.success && res.module) {
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
        permissionsLoaded,
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
        createModule,
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
    permissionsLoaded,
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
    permissionsLoaded,
  };
};

export default AccessControlContext;
