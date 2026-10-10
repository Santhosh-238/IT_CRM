import { prisma } from '../config/prisma.js';

/**
 * Dynamic Access Control & Role Model
 * Interfaces directly with Prisma DB for roles, permissions, and audit logs
 */
export class RoleModel {
  static async findMany(where = {}, options = {}) {
    const { include, orderBy } = options;
    return await prisma.role.findMany({
      where,
      include: include || { permissions: true, users: true },
      orderBy: orderBy || { createdAt: 'asc' },
    });
  }

  static async findById(id) {
    return await prisma.role.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { name: id }],
      },
      include: {
        permissions: true,
        users: true,
      },
    });
  }

  static async create(data) {
    return await prisma.role.create({
      data,
      include: { permissions: true },
    });
  }

  static async update(id, data) {
    return await prisma.role.update({
      where: { id },
      data,
      include: { permissions: true },
    });
  }

  static async delete(id) {
    return await prisma.role.delete({
      where: { id },
    });
  }

  static async count(where = {}) {
    return await prisma.role.count({ where });
  }
}

export class PermissionModel {
  static async findMany(where = {}) {
    return await prisma.rolePermission.findMany({ where });
  }

  static async upsert(roleId, moduleId, data) {
    return await prisma.rolePermission.upsert({
      where: {
        roleId_moduleId: { roleId, moduleId },
      },
      update: data,
      create: { roleId, moduleId, ...data },
    });
  }

  static async deleteMany(where = {}) {
    return await prisma.rolePermission.deleteMany({ where });
  }
}

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
};

export default {
  RoleModel,
  PermissionModel,
  ACCESS_MODULE,
};
