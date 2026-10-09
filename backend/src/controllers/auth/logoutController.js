import { clearAuthCookie } from '../../middleware/auth.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';

/**
 * Handle User Logout
 * Invalidates user session in Redis cache, clears HttpOnly auth cookie,
 * and records security audit trail.
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

    // Clear HttpOnly auth cookie
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
