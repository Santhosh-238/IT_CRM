import { getUserPermissions } from '../../middleware/authorizePermission.js';

/**
 * Get current authenticated user's permissions and role
 */
export async function getMyPermissions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const permissionsData = await getUserPermissions(req.user);

    return res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      role: permissionsData?.role,
      permissions: permissionsData?.permissions || {},
      isSuperAdmin: Boolean(permissionsData?.isSuperAdmin),
    });
  } catch (error) {
    console.error('[Get My Permissions Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
