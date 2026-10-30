import pkg from '../generated/client_v2/index.js';
const { PrismaClient } = pkg;

// Singleton Prisma Client instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
