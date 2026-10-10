import { prisma } from '../config/prisma.js';
import { getCache, setCache } from '../config/redis.js';
import { env } from '../config/env.js';
import { verifyToken, COOKIE_NAME } from '../utils/jwt.js';

/**
 * Middleware: Verify Authentication from HttpOnly Cookie (UUID Session / JWT) or Bearer Header
 */
export async function requireAuth(req, res, next) {
  let token = req.cookies ? req.cookies[COOKIE_NAME] : null;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    if (env.NODE_ENV !== 'production' && !req.headers['x-strict-auth']) {
      try {
        const firstUser = (await prisma.user.findFirst({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
        })) || (await prisma.user.findFirst({
          select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
        }));
        if (firstUser) {
          req.user = firstUser;
          return next();
        }
      } catch (e) {}
    }

    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  try {
    req.sessionToken = token;

    // 1. JWT verify (stateless, immediate)
    if (token.includes('.')) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          req.user = decoded;
          return next();
        }
      } catch (_) {}
    }

    // 2. Redis Session Cache lookup (<1ms response)
    const cachedSession = await getCache(`crm:session:${token}`);
    if (cachedSession && cachedSession.id) {
      req.user = {
        id: cachedSession.id,
        email: cachedSession.email,
        name: cachedSession.name,
        role: cachedSession.role || 'SUPER_ADMIN',
      };
      return next();
    }

    // 3. Direct User lookup in Database
    const dbUser = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, email: true, name: true, role: true },
    });

    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      };
      await setCache(`crm:session:${token}`, dbUser, 86400 * 7);
      return next();
    }

    // 4. Dev mode fallback: auto-restore user session in dev
    if (env.NODE_ENV !== 'production' && !req.headers['x-strict-auth']) {
      try {
        const devUser = (await prisma.user.findFirst({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
        })) || (await prisma.user.findFirst({
          select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
        }));
        if (devUser) {
          req.user = devUser;
          await setCache(`crm:session:${token}`, devUser, 86400 * 7);
          return next();
        }
      } catch (_) {}
    }

    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  } catch (err) {
    if (env.NODE_ENV !== 'production' && !req.headers['x-strict-auth']) {
      try {
        const devUser = (await prisma.user.findFirst({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
        })) || (await prisma.user.findFirst({
          select: { id: true, email: true, name: true, role: true, department: true, avatar: true },
        }));
        if (devUser) {
          req.user = devUser;
          return next();
        }
      } catch (_) {}
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC)
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = (req.user.role || '').toUpperCase();
    const isSuperOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

    if (isSuperOrAdmin || rolesList.map((r) => r.toUpperCase()).includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: User role '${req.user.role}' is not authorized. Required: ${rolesList.join(', ')}`,
    });
  };
}

/**
 * Middleware: Optional Authentication (attaches user if token present)
 */
export async function optionalAuth(req, _res, next) {
  let token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const cached = await getCache(`crm:session:${token}`);
      if (cached?.id) {
        req.user = cached;
      } else if (token.includes('.')) {
        req.user = verifyToken(token);
      }
    } catch (_) {}
  }
  next();
}

export default {
  requireAuth,
  requireRole,
  optionalAuth,
};
