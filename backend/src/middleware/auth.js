import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getCache, setCache } from '../config/redis.js';
import { prisma } from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'crm_super_secret_jwt_key_2026';
const COOKIE_NAME = 'access_token';

/**
 * Generate Clean UUID Session Token
 */
export function generateSessionToken() {
  return crypto.randomUUID();
}

/**
 * Generate signed JWT Token (Fallback)
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Set Secure HttpOnly Cookie (Stores Clean UUID Session Token)
 */
export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // Prevents XSS attacks (JS cannot access cookie)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    path: '/',
  });
}

/**
 * Clear Auth Cookie
 */
export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}

/**
 * Middleware: Verify Auth from HttpOnly Cookie (UUID Session / JWT) or Bearer Header
 */
export async function requireAuth(req, res, next) {
  // 1. Try reading from HttpOnly cookie
  let token = req.cookies ? req.cookies[COOKIE_NAME] : null;

  // 2. Fallback to Authorization: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    // For demo/dev ease without hard blocking when running local client
    if (process.env.NODE_ENV !== 'production' && !req.headers['x-strict-auth']) {
      req.user = {
        id: 'usr-dev-superadmin',
        email: 'vikram.sundaram@omnitech.io',
        name: 'Vikram Sundaram',
        role: 'SUPER_ADMIN',
      };
      return next();
    }

    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  try {
    req.sessionToken = token;

    // ⚡ 1. Primary Check: Look up clean UUID Session Token in Redis (<1ms response)
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

    // 🗄️ 2. Secondary Check: Direct User UUID in PostgreSQL Database
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
      // Re-populate Redis session cache for instant future calls
      await setCache(`crm:session:${token}`, dbUser, 86400 * 7);
      return next();
    }

    // 🔐 3. Fallback Check: Encoded JWT token decoding (if legacy/custom token)
    if (token.includes('.')) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  } catch (err) {
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

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized for this resource. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
