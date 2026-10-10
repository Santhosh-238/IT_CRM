import * as crmService from '../services/crm.service.js';

/**
 * 1. GET Dashboard Stats (Dynamically computed from Prisma & cached in Redis)
 */
export async function getDashboardStats(_req, res) {
  try {
    const result = await crmService.getDashboardStatsService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. REDIS / CACHE Live Status & Space Monitor Endpoint
 */
export async function getRedisStatus(_req, res) {
  try {
    const result = await crmService.getRedisStatusService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. CLEAR ALL DATABASE DATA & FLUSH CACHE
 */
export async function clearAllDatabaseData(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await crmService.clearAllDatabaseDataService(req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Database clear failed: ${error.message}`,
    });
  }
}

export default {
  getDashboardStats,
  getRedisStatus,
  clearAllDatabaseData,
};
