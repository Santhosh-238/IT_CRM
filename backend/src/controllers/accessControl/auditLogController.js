import { prisma } from '../../config/prisma.js';

/**
 * Get Access Control & RBAC Audit Logs
 */
export async function getAuditLogs(req, res) {
  try {
    const { action, targetType, page = 1, limit = 50 } = req.query;

    const where = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (targetType && targetType !== 'ALL') {
      where.targetType = targetType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.accessAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.accessAuditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Get Audit Logs Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
