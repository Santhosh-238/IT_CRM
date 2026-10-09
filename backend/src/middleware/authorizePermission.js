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

  // Fetch user with role relation & permissions
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

  // If user doesn't have roleRelation but has role string 'SUPER_ADMIN'
  if (!dbUser?.roleRelation) {
    const superAdminRole = await prisma.role.findUnique({
      where: { slug: 'super_admin' },
      include: { permissions: true },
    });

    if (superAdminRole && (dbUser?.role === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN')) {
      const permsMap = {};
      superAdminRole.permissions.forEach((p) => {
        permsMap[p.moduleId] = {
          view: p.canView,
          create: p.canCreate,
          edit: p.canEdit,
          delete: p.canDelete,
          export: p.canExport,
          approve: p.canApprove,
        };
      });

      const result = {
        role: {
          id: superAdminRole.id,
          name: superAdminRole.name,
          slug: superAdminRole.slug,
          isSystem: true,
        },
        permissions: permsMap,
        isSuperAdmin: true,
      };

      await setCache(cacheKey, result, 3600); // 1 hour
      return result;
    }
  }

  const role = dbUser?.roleRelation;
  const permsMap = {};
  const isSuperAdmin = role?.slug === 'super_admin' || dbUser?.role === 'SUPER_ADMIN';

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
 * Express Middleware: Authorize by Module & Action (view, create, edit, delete, export, approve)
 */
export function authorizePermission(moduleId, action = 'view') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      // Bypass for Super Admin role
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
