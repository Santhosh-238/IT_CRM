import * as authService from '../services/auth.service.js';

/**
 * Handle User Registration / Signup
 * POST /api/auth/signup
 */
export async function signup(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await authService.signupService(req.body, ip, res);
    return res.status(201).json({
      success: true,
      ...result,
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
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await authService.loginService(req.body, ip, res);
    return res.status(200).json({
      success: true,
      ...result,
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
