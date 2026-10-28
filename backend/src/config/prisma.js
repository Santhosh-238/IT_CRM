import { PrismaClient } from '../generated/client_v2/index.js';

// Singleton Prisma Client instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
