import * as settingsService from '../services/settings.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ------------------------------------------------------------------
// Master Project & Module Configuration Handlers
// ------------------------------------------------------------------

export async function getMasterProjects(req, res) {
  try {
    const projects = await settingsService.getMasterProjectsService(req.query);
    return sendSuccess(res, projects, 'Master projects retrieved successfully');
  } catch (error) {
    console.error('getMasterProjects error:', error);
    return sendError(res, error.message || 'Failed to fetch master projects', 500);
  }
}

export async function getMasterProjectById(req, res) {
  try {
    const project = await settingsService.getMasterProjectByIdService(req.params.id);
    return sendSuccess(res, project, 'Master project retrieved successfully');
  } catch (error) {
    console.error('getMasterProjectById error:', error);
    return sendError(res, error.message || 'Master project not found', 404);
  }
}

export async function createMasterProject(req, res) {
  try {
    const userId = req.user?.id || req.body.userId || 'admin';
    const project = await settingsService.createMasterProjectService(req.body, userId);
    return sendSuccess(res, project, 'Master project and modules created successfully', 201);
  } catch (error) {
    console.error('createMasterProject error:', error);
    return sendError(res, error.message || 'Failed to create master project', 400);
  }
}

export async function updateMasterProject(req, res) {
  try {
    const project = await settingsService.updateMasterProjectService(req.params.id, req.body);
    return sendSuccess(res, project, 'Master project and modules updated successfully');
  } catch (error) {
    console.error('updateMasterProject error:', error);
    return sendError(res, error.message || 'Failed to update master project', 400);
  }
}

export async function deleteMasterProject(req, res) {
  try {
    await settingsService.deleteMasterProjectService(req.params.id);
    return sendSuccess(res, null, 'Master project deleted successfully');
  } catch (error) {
    console.error('deleteMasterProject error:', error);
    return sendError(res, error.message || 'Failed to delete master project', 500);
  }
}

// ------------------------------------------------------------------
// System Settings Handlers (Company Profile, CRM Presets, Security)
// ------------------------------------------------------------------

export async function getCompanyProfile(req, res) {
  try {
    const profile = await settingsService.getSettingService('company_profile');
    return sendSuccess(res, profile, 'Company profile retrieved successfully');
  } catch (error) {
    console.error('getCompanyProfile error:', error);
    return sendError(res, error.message || 'Failed to fetch company profile', 500);
  }
}

export async function updateCompanyProfile(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const updated = await settingsService.saveSettingService('company_profile', req.body, userId);
    return sendSuccess(res, updated, 'Company profile updated successfully');
  } catch (error) {
    console.error('updateCompanyProfile error:', error);
    return sendError(res, error.message || 'Failed to update company profile', 400);
  }
}

export async function getCrmPipelineSettings(req, res) {
  try {
    const presets = await settingsService.getSettingService('crm_pipeline');
    return sendSuccess(res, presets, 'CRM pipeline settings retrieved successfully');
  } catch (error) {
    console.error('getCrmPipelineSettings error:', error);
    return sendError(res, error.message || 'Failed to fetch CRM settings', 500);
  }
}

export async function updateCrmPipelineSettings(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const updated = await settingsService.saveSettingService('crm_pipeline', req.body, userId);
    return sendSuccess(res, updated, 'CRM pipeline settings updated successfully');
  } catch (error) {
    console.error('updateCrmPipelineSettings error:', error);
    return sendError(res, error.message || 'Failed to update CRM settings', 400);
  }
}

export async function getSecuritySettings(req, res) {
  try {
    const settings = await settingsService.getSettingService('security_settings');
    return sendSuccess(res, settings, 'Security settings retrieved successfully');
  } catch (error) {
    console.error('getSecuritySettings error:', error);
    return sendError(res, error.message || 'Failed to fetch security settings', 500);
  }
}

export async function updateSecuritySettings(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const updated = await settingsService.saveSettingService('security_settings', req.body, userId);
    return sendSuccess(res, updated, 'Security settings updated successfully');
  } catch (error) {
    console.error('updateSecuritySettings error:', error);
    return sendError(res, error.message || 'Failed to update security settings', 400);
  }
}

export async function resetSetting(req, res) {
  try {
    const key = req.params.key;
    const reset = await settingsService.resetSettingService(key);
    return sendSuccess(res, reset, `Settings for ${key} reset to factory defaults`);
  } catch (error) {
    console.error('resetSetting error:', error);
    return sendError(res, error.message || 'Failed to reset settings', 500);
  }
}

// ------------------------------------------------------------------
// Realtime User Profile ("My Profile") Handlers
// ------------------------------------------------------------------

export async function getUserProfile(req, res) {
  try {
    const profile = await settingsService.getUserProfileService(req.user);
    return sendSuccess(res, profile, 'Real-time user profile retrieved successfully');
  } catch (error) {
    console.error('getUserProfile error:', error);
    return sendError(res, error.message || 'Failed to fetch user profile', 500);
  }
}

export async function updateUserProfile(req, res) {
  try {
    const updated = await settingsService.updateUserProfileService(req.user, req.body);
    return sendSuccess(res, updated, 'User profile updated successfully');
  } catch (error) {
    console.error('updateUserProfile error:', error);
    return sendError(res, error.message || 'Failed to update user profile', 400);
  }
}

export async function changePassword(req, res) {
  try {
    const result = await settingsService.changePasswordService(req.user, req.body);
    return sendSuccess(res, result, 'Password changed successfully');
  } catch (error) {
    console.error('changePassword error:', error);
    return sendError(res, error.message || 'Failed to change password', 400);
  }
}

export async function getSecurityAuditLogs(req, res) {
  try {
    const logs = await settingsService.getSecurityAuditLogsService(4);
    return sendSuccess(res, logs, 'Security logs retrieved successfully');
  } catch (error) {
    console.error('getSecurityAuditLogs error:', error);
    return sendError(res, error.message || 'Failed to fetch security logs', 500);
  }
}

export async function getNotificationSettings(req, res) {
  try {
    const settings = await settingsService.getSettingService('notifications');
    return sendSuccess(res, settings, 'Notification settings retrieved successfully');
  } catch (error) {
    console.error('getNotificationSettings error:', error);
    return sendError(res, error.message || 'Failed to fetch notification settings', 500);
  }
}

export async function updateNotificationSettings(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const updated = await settingsService.saveSettingService('notifications', req.body, userId);
    return sendSuccess(res, updated, 'Notification settings updated successfully');
  } catch (error) {
    console.error('updateNotificationSettings error:', error);
    return sendError(res, error.message || 'Failed to update notification settings', 400);
  }
}

// -------------------------------------------------------------
// Calendar & Confidential Reminders Controller Handlers
// -------------------------------------------------------------

export async function getReminders(req, res) {
  try {
    const reminders = await settingsService.getRemindersService(req.user);
    return sendSuccess(res, reminders, 'Reminders retrieved successfully');
  } catch (error) {
    console.error('getReminders error:', error);
    return sendError(res, error.message || 'Failed to fetch reminders', 500);
  }
}

export async function createReminder(req, res) {
  try {
    const reminder = await settingsService.createReminderService(req.user, req.body);
    return sendSuccess(res, reminder, 'Confidential reminder scheduled and shared with Super Admin', 201);
  } catch (error) {
    console.error('createReminder error:', error);
    return sendError(res, error.message || 'Failed to create reminder', 400);
  }
}

export async function updateReminder(req, res) {
  try {
    const { id } = req.params;
    const reminder = await settingsService.updateReminderService(req.user, id, req.body);
    return sendSuccess(res, reminder, 'Reminder updated successfully');
  } catch (error) {
    console.error('updateReminder error:', error);
    return sendError(res, error.message || 'Failed to update reminder', 400);
  }
}

export async function deleteReminder(req, res) {
  try {
    const { id } = req.params;
    const result = await settingsService.deleteReminderService(req.user, id);
    return sendSuccess(res, result, 'Reminder deleted successfully');
  } catch (error) {
    console.error('deleteReminder error:', error);
    return sendError(res, error.message || 'Failed to delete reminder', 400);
  }
}

export async function getDueReminders(req, res) {
  try {
    const due = await settingsService.getDueRemindersService(req.user);
    return sendSuccess(res, due, 'Due notifications retrieved successfully');
  } catch (error) {
    console.error('getDueReminders error:', error);
    return sendError(res, error.message || 'Failed to fetch due notifications', 500);
  }
}
