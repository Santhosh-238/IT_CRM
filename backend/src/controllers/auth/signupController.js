import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { generateSessionToken, generateToken, setAuthCookie } from '../../middleware/auth.js';
import { setCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';

/**
 * Handle User Registration / Signup
 * Validates input, hashes password, saves to PostgreSQL, sets HttpOnly Cookie,
 * stores session in Redis, and records audit trail.
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

    // Check if user already exists in PostgreSQL
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login.',
      });
    }

    // Hash password securely with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in PostgreSQL database
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

    // Generate clean UUID session token
    const sessionToken = generateSessionToken();

    // Set secure HttpOnly cookie containing clean UUID
    setAuthCookie(res, sessionToken);

    // Save session in Redis cache by session UUID & by user UUID (7 days)
    await setCache(`crm:session:${sessionToken}`, newUser, 86400 * 7);
    await setCache(`crm:session:${newUser.id}`, newUser, 86400 * 7);

    // Log security audit event
    await logAuditEvent({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'CREATE',
      entity: 'USER',
      entityId: newUser.id,
      ipAddress: req.ip,
      details: `User account registered for ${newUser.name} (${newUser.email}) with phone ${newUser.phone || 'N/A'}.`,
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

// Alias for compatibility
export const register = signup;
