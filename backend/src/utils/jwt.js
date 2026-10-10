import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'access_token';

/**
 * Generate Clean UUID Session Token
 */
export function generateSessionToken() {
  return crypto.randomUUID();
}

/**
 * Generate signed JWT Token
 */
export function generateToken(payload, expiresIn = env.JWT_EXPIRATION) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

/**
 * Verify signed JWT Token
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Set Secure HttpOnly Cookie
 */
export function setAuthCookie(res, token) {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // Prevents XSS attacks
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
  const isProduction = env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}

export default {
  COOKIE_NAME,
  generateSessionToken,
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
