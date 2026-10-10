import { prisma } from '../config/prisma.js';
import { setCache } from '../config/redis.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateSessionToken, generateToken, setAuthCookie } from '../utils/jwt.js';
import { logAuditEvent } from '../services/auditService.js';
import * as authService from '../services/auth.service.js';

/**
 * Handle User Registration / Signup
 * POST /api/auth/signup
 */
export async function signup(req, res) {
  try {
    const { organisationName, organizationName, companyName, name, email, phone, password, confirmPassword } = req.body;
    const orgName = (organisationName || organizationName || companyName || '').trim();

    if (!orgName) {
      return res.status(400).json({
        success: false,
        message: 'Organisation Name is mandatory. Registration is strictly for Organisation Super Admins.',
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin Name, Email Address, and Password are required.',
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

    // Link to Admin role in RBAC
    const adminRole = await prisma.role.findFirst({
      where: {
        OR: [
          { slug: 'admin' },
          { slug: 'super_admin' },
          { name: { equals: 'Admin', mode: 'insensitive' } },
        ],
      },
    });

    // Optionally ensure Company entry exists
    try {
      await prisma.company.upsert({
        where: { name: orgName },
        update: {},
        create: {
          name: orgName,
        },
      });
    } catch (_) {}

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        passwordHash,
        role: 'SUPER_ADMIN',
        roleId: adminRole?.id || null,
        department: orgName,
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

    const sessionToken = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });
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
    return res.status(error.status || 500).json({
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
    const { email, username, id: empIdInput, password } = req.body;
    const identifier = (email || username || empIdInput || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or Employee ID and password are required.',
      });
    }

    // 1. Check if identifier matches an Employee by empCode or email
    const matchedEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { empCode: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
        ],
      },
    });

    const targetEmail = matchedEmployee ? matchedEmployee.email.toLowerCase().trim() : identifier.toLowerCase();

    // 2. Find User by email or direct identifier match
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: targetEmail, mode: 'insensitive' } },
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address/Employee ID or password.',
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address/Employee ID or password.',
      });
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || matchedEmployee?.phone || null,
      role: user.role,
      department: user.department || matchedEmployee?.department,
      avatar: user.avatar,
      empCode: matchedEmployee?.empCode || null,
    };

    const sessionToken = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
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
    return res.status(error.status || 500).json({
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
    const sessionToken = req.sessionToken || (req.cookies ? req.cookies['access_token'] : null);
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await authService.logoutService(req.user, sessionToken, ip, res);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Logout Controller Error]', error);
    return res.status(error.status || 500).json({
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
    const result = await authService.getCurrentUserService(req.user);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Session Controller Error]', error);
    return res.status(error.status || 500).json({
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
