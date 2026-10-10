/**
 * Authentication Module Definition & Session Schema
 */
export const AUTH_MODULE = {
  id: 'auth',
  name: 'Authentication',
  category: 'Core',
  description: 'User login, registration, JWT session token management, Redis session caching, and identity verification.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  schema: {
    user: {
      fields: ['id', 'email', 'name', 'phone', 'role', 'department', 'avatar', 'passwordHash', 'createdAt', 'updatedAt'],
    },
    session: {
      fields: ['sessionToken', 'userId', 'expiresAt', 'cachedInRedis'],
    },
  },
};

export default AUTH_MODULE;
