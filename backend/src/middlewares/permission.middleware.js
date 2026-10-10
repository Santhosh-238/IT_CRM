import { prisma } from '../config/prisma.js';
import { getCache, setCache } from '../config/redis.js';

/**
 * Fetch and cache user permissions
 */
export async function getUserPermissions(user) {
  if (!user || !user.id) return null;

  const cacheKey = `crm:perms:${user.id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roleRelation: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!dbUser?.roleRelation) {
    const adminRole = await prisma.role.findFirst({
      where: {
        OR: [
          { slug: 'admin' },
          { slug: 'super_admin' },
          { name: { equals: 'Admin', mode: 'insensitive' } },
        ],
      },
      include: { permissions: true },
    });

    const isUserAdmin =
      dbUser?.role === 'SUPER_ADMIN' ||
      dbUser?.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN';

    if (adminRole && isUserAdmin) {
      const permsMap = {};
      adminRole.permissions.forEach((p) => {
        permsMap[p.moduleId] = {
          view: true,
          create: true,
          edit: true,
          delete: true,
          export: true,
          approve: true,
        };
      });

      const result = {
        role: {
          id: adminRole.id,
          name: adminRole.name,
          slug: adminRole.slug,
          isSystem: true,
        },
        permissions: permsMap,
        isSuperAdmin: true,
      };

      await setCache(cacheKey, result, 3600);
      return result;
    }
  }

  const role = dbUser?.roleRelation;
  const permsMap = {};
  const isSuperAdmin =
    role?.slug === 'super_admin' ||
    role?.slug === 'admin' ||
    dbUser?.role === 'SUPER_ADMIN' ||
    dbUser?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN';

  if (role?.permissions) {
    role.permissions.forEach((p) => {
      permsMap[p.moduleId] = {
        view: isSuperAdmin ? true : p.canView,
        create: isSuperAdmin ? true : p.canCreate,
        edit: isSuperAdmin ? true : p.canEdit,
        delete: isSuperAdmin ? true : p.canDelete,
        export: isSuperAdmin ? true : p.canExport,
        approve: isSuperAdmin ? true : p.canApprove,
      };
    });
  }

  const result = {
    role: role
      ? {
          id: role.id,
          name: role.name,
          slug: role.slug,
          isSystem: role.isSystem,
        }
      : {
          name: dbUser?.role || 'Staff',
          slug: 'custom',
        },
    permissions: permsMap,
    isSuperAdmin,
  };

  await setCache(cacheKey, result, 3600);
  return result;
}

/**
 * Express Middleware: Authorize by Module & Action
 */
export function authorizePermission(moduleId, action = 'view') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const userPerms = await getUserPermissions(req.user);
      if (!userPerms) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Unable to resolve user permissions.',
        });
      }

      if (userPerms.isSuperAdmin) {
        return next();
      }

      const modulePerms = userPerms.permissions[moduleId];
      if (!modulePerms || !modulePerms[action]) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You do not have '${action}' permission for '${moduleId}'.`,
          requiredPermission: { module: moduleId, action },
        });
      }

      next();
    } catch (error) {
      console.error('[Authorize Permission Error]', error);
      return res.status(500).json({ success: false, message: 'Internal authorization error.' });
    }
  };
}

export default {
  getUserPermissions,
  authorizePermission,
};
