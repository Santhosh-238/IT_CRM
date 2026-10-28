import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'crm_super_secret_jwt_key_2026',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export default env;
