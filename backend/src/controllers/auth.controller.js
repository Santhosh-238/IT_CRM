import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache } from '../config/redis.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateSessionToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { logAuditEvent } from '../services/auditService.js';

/**
 * Handle User Registration / Signup
 * POST /api/auth/signup
 */
export async function signup(req, res) {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email Address, and Password are required.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login.',
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        passwordHash,
        role: 'SUPER_ADMIN',
        department: 'Executive Leadership',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    const sessionToken = generateSessionToken();
    setAuthCookie(res, sessionToken);

    await setCache(`crm:session:${sessionToken}`, newUser, 86400 * 7);
    await setCache(`crm:session:${newUser.id}`, newUser, 86400 * 7);

    await logAuditEvent({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'CREATE',
      entity: 'USER',
      entityId: newUser.id,
      ipAddress: req.ip,
      details: `User account registered for ${newUser.name} (${newUser.email}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Session initialized.',
      user: newUser,
      token: sessionToken,
    });
  } catch (error) {
    console.error('[Signup Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
}

export const register = signup;

/**
 * Handle User Login / Sign In
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || null,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
    };

    const sessionToken = generateSessionToken();
    setAuthCookie(res, sessionToken);

    await setCache(`crm:session:${sessionToken}`, userProfile, 86400 * 7);
    await setCache(`crm:session:${user.id}`, userProfile, 86400 * 7);

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: user.id,
      ipAddress: req.ip,
      details: `User ${user.name} logged in successfully. Session cached in Redis.`,
    });

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: userProfile,
      token: sessionToken,
    });
  } catch (error) {
    console.error('[Login Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
}

/**
 * Handle User Logout
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    const userId = req.user?.id;
    const sessionToken = req.sessionToken || (req.cookies ? req.cookies['access_token'] : null);

    if (userId) {
      await delCache(`crm:session:${userId}`);
    }
    if (sessionToken) {
      await delCache(`crm:session:${sessionToken}`);
    }

    clearAuthCookie(res);

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'LOGOUT',
        entity: 'AUTH',
        entityId: req.user.id,
        ipAddress: req.ip,
        details: `User ${req.user.name} logged out. Redis session purged and cookie cleared.`,
      });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully! Redis session purged and cookie cleared.',
    });
  } catch (error) {
    console.error('[Logout Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during logout.',
    });
  }
}

/**
 * Handle Current Session User Verification (/me)
 * GET /api/auth/me or /api/auth/session
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    const cachedSession = await getCache(`crm:session:${req.user.id}`);
    if (cachedSession) {
      return res.json({
        success: true,
        source: '⚡ Redis Session Cache (<1ms)',
        user: cachedSession,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database.',
      });
    }

    await setCache(`crm:session:${user.id}`, user, 86400);

    return res.json({
      success: true,
      source: '🗄️ PostgreSQL (Prisma)',
      user,
    });
  } catch (error) {
    console.error('[Session Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export default {
  signup,
  register,
  login,
  logout,
  getCurrentUser,
};
