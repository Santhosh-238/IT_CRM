import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { generateSessionToken, generateToken, setAuthCookie } from '../../middleware/auth.js';
import { setCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';

/**
 * Handle User Login / Sign In
 * Validates credentials against PostgreSQL, checks bcrypt hash,
 * sets HttpOnly UUID session cookie, caches session in Redis, and records audit log.
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

    // Find user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Verify bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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

    // Generate clean UUID session token
    const sessionToken = generateSessionToken();

    // Set secure HttpOnly cookie containing clean UUID
    setAuthCookie(res, sessionToken);

    // Save session in Redis Cache by session UUID and by user ID (7 Days)
    await setCache(`crm:session:${sessionToken}`, userProfile, 86400 * 7);
    await setCache(`crm:session:${user.id}`, userProfile, 86400 * 7);

    // Log security audit event
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: user.id,
      ipAddress: req.ip,
      details: `User ${user.name} (${user.email}) logged in successfully.`,
    });

    return res.json({
      success: true,
      message: 'Login successful! HttpOnly UUID session stored securely.',
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
