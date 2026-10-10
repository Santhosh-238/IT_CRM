import {
  Role,
  SystemModule,
  UserWithRole,
  AccessAuditLog,
  RoleFormData,
  MyPermissionsResponse,
} from '../types/accessControl';

const API_BASE = '/api/access-control';

export const accessControlService = {
  /**
   * Get current authenticated user's permissions and role
   */
  async getMyPermissions(): Promise<{ success: boolean; data?: MyPermissionsResponse; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/my-permissions`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user permissions');
      return { success: true, data };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Get all roles with permissions and user count
   */
  async getRoles(): Promise<{
    success: boolean;
    roles?: Role[];
    systemModules?: SystemModule[];
    totalRoles?: number;
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch roles');
      return {
        success: true,
        roles: data.roles || [],
        systemModules: data.systemModules || [],
        totalRoles: data.totalRoles || 0,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Get single role details
   */
  async getRoleById(id: string): Promise<{ success: boolean; role?: Role; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/roles/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch role');
      return { success: true, role: data.role };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Create a new custom role
   */
  async createRole(formData: RoleFormData): Promise<{ success: boolean; role?: Role; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create role');
      return { success: true, role: data.role, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Update role metadata and permissions matrix
   */
  async updateRole(
    id: string,
    formData: Partial<RoleFormData>
  ): Promise<{ success: boolean; role?: Role; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      return { success: true, role: data.role, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Clone an existing role
   */
  async cloneRole(
    id: string,
    newName: string,
    description?: string
  ): Promise<{ success: boolean; role?: Role; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/roles/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clone role');
      return { success: true, role: data.role, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Delete a custom role
   */
  async deleteRole(
    id: string,
    reassignToRoleId?: string
  ): Promise<{
    success: boolean;
    message?: string;
    requiresReassignment?: boolean;
    assignedUserCount?: number;
  }> {
    try {
      const res = await fetch(`${API_BASE}/roles/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignToRoleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || 'Failed to delete role',
          requiresReassignment: data.requiresReassignment,
          assignedUserCount: data.assignedUserCount,
        };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Get users with role assignments
   */
  async getUsers(params?: {
    search?: string;
    roleId?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    users?: UserWithRole[];
    departments?: string[];
    pagination?: { total: number; page: number; limit: number; totalPages: number };
    message?: string;
  }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.roleId) query.append('roleId', params.roleId);
      if (params?.department) query.append('department', params.department);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE}/users?${query.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      return {
        success: true,
        users: data.users || [],
        departments: data.departments || [],
        pagination: data.pagination,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Assign/Reassign a user's role
   */
  async assignUserRole(
    userId: string,
    roleId: string
  ): Promise<{ success: boolean; user?: UserWithRole; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign role');
      return { success: true, user: data.user, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Bulk assign roles to multiple users
   */
  async bulkAssignUserRoles(
    userIds: string[],
    roleId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/bulk-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, roleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to bulk assign roles');
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Get Access Control Audit Logs
   */
  async getAuditLogs(params?: {
    action?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    logs?: AccessAuditLog[];
    pagination?: { total: number; page: number; limit: number; totalPages: number };
    message?: string;
  }> {
    try {
      const query = new URLSearchParams();
      if (params?.action) query.append('action', params.action);
      if (params?.targetType) query.append('targetType', params.targetType);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch audit logs');
      return { success: true, logs: data.logs || [], pagination: data.pagination };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
