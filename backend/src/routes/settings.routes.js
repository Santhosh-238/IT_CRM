import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as settingsController from '../controllers/settings.controller.js';

const router = Router();

// Require auth for settings routes (falls back safely to super admin in local dev)
router.use(requireAuth);

// Master Projects & Module Configuration
router.get('/projects', settingsController.getMasterProjects);
router.get('/projects/:id', settingsController.getMasterProjectById);
router.post('/projects', settingsController.createMasterProject);
router.put('/projects/:id', settingsController.updateMasterProject);
router.delete('/projects/:id', settingsController.deleteMasterProject);

// Realtime User Profile ("My Profile") Settings
router.get('/profile', settingsController.getUserProfile);
router.put('/profile', settingsController.updateUserProfile);
router.post('/change-password', settingsController.changePassword);

// Company Profile Settings
router.get('/company', settingsController.getCompanyProfile);
router.put('/company', settingsController.updateCompanyProfile);

// CRM Pipeline & Presets
router.get('/crm-pipeline', settingsController.getCrmPipelineSettings);
router.put('/crm-pipeline', settingsController.updateCrmPipelineSettings);

// Security & System Preferences
router.get('/security', settingsController.getSecuritySettings);
router.put('/security', settingsController.updateSecuritySettings);
router.get('/audit-logs', settingsController.getSecurityAuditLogs);

// Notification Preferences
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// Calendar & Confidential Reminders (Strict User & Super Admin Access)
router.get('/reminders', settingsController.getReminders);
router.post('/reminders', settingsController.createReminder);
router.put('/reminders/:id', settingsController.updateReminder);
router.delete('/reminders/:id', settingsController.deleteReminder);
router.get('/reminders/due', settingsController.getDueReminders);

// Reset Settings
router.post('/reset/:key', settingsController.resetSetting);

export default router;
