import * as callLogService from '../services/callLog.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/call-logs
 * Fetch call records with filters and search
 */
export async function getCallLogs(req, res) {
  try {
    const data = await callLogService.getCallLogsService(req.query);
    return sendSuccess(res, data, 'Call logs fetched successfully.');
  } catch (error) {
    console.error('getCallLogs error:', error);
    return sendError(res, error.message || 'Failed to fetch call logs.', error.status || 500);
  }
}

/**
 * GET /api/call-logs/stats
 * Overview KPI metrics
 */
export async function getCallLogStats(req, res) {
  try {
    const stats = await callLogService.getCallLogStatsService();
    return sendSuccess(res, stats, 'Call log statistics retrieved.');
  } catch (error) {
    console.error('getCallLogStats error:', error);
    return sendError(res, error.message || 'Failed to fetch call log statistics.', error.status || 500);
  }
}

/**
 * GET /api/call-logs/:id
 * Get single call log
 */
export async function getCallLogById(req, res) {
  try {
    const call = await callLogService.getCallLogByIdService(req.params.id);
    return sendSuccess(res, call, 'Call log details retrieved.');
  } catch (error) {
    return sendError(res, error.message || 'Call record not found.', error.status || 404);
  }
}

/**
 * POST /api/call-logs
 * Log a new call
 */
export async function createCallLog(req, res) {
  try {
    const call = await callLogService.createCallLogService(req.body);
    return sendSuccess(res, call, 'Call logged successfully.', 201);
  } catch (error) {
    console.error('createCallLog error:', error);
    return sendError(res, error.message || 'Failed to log call.', error.status || 400);
  }
}

/**
 * PUT /api/call-logs/:id
 * Update call log
 */
export async function updateCallLog(req, res) {
  try {
    const updated = await callLogService.updateCallLogService(req.params.id, req.body);
    return sendSuccess(res, updated, 'Call log updated successfully.');
  } catch (error) {
    console.error('updateCallLog error:', error);
    return sendError(res, error.message || 'Failed to update call log.', error.status || 400);
  }
}

/**
 * DELETE /api/call-logs/:id
 * Delete call log
 */
export async function deleteCallLog(req, res) {
  try {
    const result = await callLogService.deleteCallLogService(req.params.id);
    return sendSuccess(res, result, 'Call log removed successfully.');
  } catch (error) {
    console.error('deleteCallLog error:', error);
    return sendError(res, error.message || 'Failed to delete call log.', error.status || 500);
  }
}
