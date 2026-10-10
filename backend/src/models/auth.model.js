import { prisma } from '../config/prisma.js';

/**
 * Dynamic User / Auth Model
 * Handles user persistence, queries, and credentials with Prisma ORM
 */
export class UserModel {
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        roleRelation: {
          include: { permissions: true },
        },
      },
    });
  }

  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        roleRelation: {
          include: { permissions: true },
        },
      },
    });
  }

  static async findMany(where = {}, options = {}) {
    const { skip, take, orderBy, select } = options;
    return await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select: select || {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async create(data) {
    return await prisma.user.create({ data });
  }

  static async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  static async count(where = {}) {
    return await prisma.user.count({ where });
  }
}

export const AUTH_MODULE = {
  id: 'auth',
  name: 'Authentication',
  category: 'Core',
  description: 'User login, registration, JWT session token management, Redis session caching, and identity verification.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
};

export default UserModel;
