import { prisma } from '../../config/prisma.js';
import { getCache, setCache } from '../../config/redis.js';

/**
 * Handle Current Session User Verification (/me)
 * 1. Checks Redis in-memory cache first (<1ms response time)
 * 2. Falls back to PostgreSQL via Prisma if cache misses
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    // 1. Try Redis cache first (<1ms speed)
    const cachedSession = await getCache(`crm:session:${req.user.id}`);
    if (cachedSession) {
      return res.json({
        success: true,
        source: '⚡ Redis Session Cache (<1ms)',
        user: cachedSession,
      });
    }

    // 2. Fetch from PostgreSQL if cache expired
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database.',
      });
    }

    // Re-populate Redis session cache
    await setCache(`crm:session:${user.id}`, user, 86400);

    return res.json({
      success: true,
      source: '🗄️ PostgreSQL (Prisma)',
      user,
    });
  } catch (error) {
    console.error('[Session Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
