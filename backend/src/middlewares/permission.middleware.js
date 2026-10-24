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
    const isUserSuperAdmin =
      dbUser?.role === 'SUPER_ADMIN' ||
      user.role === 'SUPER_ADMIN';

    if (isUserSuperAdmin) {
      const adminRole = await prisma.role.findFirst({
        where: {
          OR: [
            { slug: 'super_admin' },
            { name: { equals: 'Super Admin', mode: 'insensitive' } },
            { slug: 'admin' },
            { name: { equals: 'Admin', mode: 'insensitive' } },
          ],
        },
        include: { permissions: true },
      });

      const permsMap = {};
      const allModules = [
        'dashboard',
        'leads',
        'negotiations',
        'negotiation',
        'contacts',
        'customers',
        'projects',
        'tasks',
        'meetings',
        'scheduled_meetings',
        'call_logs',
        'billing',
        'invoices',
        'quotations',
        'contracts',
        'employee_management',
        'access_control',
        'settings',
      ];
      allModules.forEach((mod) => {
        permsMap[mod] = {
          view: true,
          create: true,
          edit: true,
          delete: true,
          export: true,
          approve: true,
        };
      });

      if (adminRole?.permissions) {
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
      }

      const result = {
        role: adminRole
          ? {
              id: adminRole.id,
              name: adminRole.name,
              slug: adminRole.slug,
              isSystem: Boolean(adminRole.isSystem),
            }
          : {
              id: 'super-admin-role',
              name: 'Super Admin',
              slug: 'super_admin',
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
    dbUser?.role === 'SUPER_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

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

      // Check requested module or fallback to leads/deals for billing/invoices
      const modulesToCheck = Array.isArray(moduleId) ? [...moduleId] : [moduleId];
      if (modulesToCheck.includes('billing') || modulesToCheck.includes('invoices')) {
        modulesToCheck.push('billing', 'invoices', 'leads', 'deals');
      }

      let hasAccess = false;
      for (const mod of modulesToCheck) {
        const modulePerms = userPerms.permissions?.[mod];
        if (modulePerms && modulePerms[action]) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You do not have '${action}' permission for '${Array.isArray(moduleId) ? moduleId.join('/') : moduleId}'.`,
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
