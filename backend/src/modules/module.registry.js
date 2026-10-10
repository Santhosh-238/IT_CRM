/**
 * Static System Modules Catalogue & Categories
 */
export const SYSTEM_MODULES = [
  // 1. Core
  { id: 'dashboard', name: 'Dashboard', category: 'Core', description: 'Executive analytics, revenue, KPIs, and overview charts.' },
  { id: 'employee_dashboard', name: 'Employee Dashboard', category: 'Core', description: 'Individual employee stats, tasks, and activity feeds.' },
  { id: 'distributor_dashboard', name: 'Distributor Dashboard', category: 'Core', description: 'Partner and distribution network metrics.' },
  { id: 'calendar', name: 'Calendar & Reminders', category: 'Core', description: 'Enterprise scheduling, deadlines, and alerts.' },
  { id: 'daily_working_plan', name: 'Daily Working Plan', category: 'Core', description: 'Daily agenda, target commitments, and schedules.' },

  // 2. Administration
  { id: 'access_control', name: 'Access Control', category: 'Administration', description: 'Role-Based Access Control, permissions matrix, and role hierarchy.' },
  { id: 'settings', name: 'System Settings', category: 'Administration', description: 'Global platform preferences, branding, and integrations.' },
  { id: 'audit_logs', name: 'Audit Trail', category: 'Administration', description: 'Security audit logs, user actions, and change tracking.' },

  // 3. Management
  { id: 'employee_management', name: 'Employee Management', category: 'Management', description: 'Staff directory, onboarding, designations, and profiles.' },
  { id: 'attendance', name: 'Attendance', category: 'Management', description: 'Check-in/out logs, working hours, and presence records.' },
  { id: 'shift_details', name: 'Shift Details', category: 'Management', description: 'Shift rosters, timing configurations, and rotations.' },
  { id: 'area_dashboard', name: 'Area Dashboard', category: 'Management', description: 'Regional performance, territory KPIs, and branch metrics.' },
  { id: 'leave_management', name: 'Leave Management', category: 'Management', description: 'Leave requests, quota balances, and manager approvals.' },

  // 4. Sales & CRM
  { id: 'contacts', name: 'Contacts Directory', category: 'Sales & CRM', description: 'Customer profiles, contact details, and account ownership.' },
  { id: 'companies', name: 'Companies & Accounts', category: 'Sales & CRM', description: 'Enterprise client organizations, domains, and contracts.' },
  { id: 'leads', name: 'Sales Leads', category: 'Sales & CRM', description: 'Prospect pipeline, lead stages, and qualification workflows.' },
  { id: 'deals', name: 'Deals & Revenue', category: 'Sales & CRM', description: 'Sales opportunities, closing probabilities, and forecasts.' },

  // 5. Field Operations
  { id: 'projects', name: 'IT Projects', category: 'Field Operations', description: 'Client project delivery, sprints, and task SLA.' },
  { id: 'client_visits', name: 'Client Visits', category: 'Field Operations', description: 'On-site client meetings, field logs, and geo-tracking.' },
  { id: 'daily_reports', name: 'Daily Reports', category: 'Field Operations', description: 'End-of-day operational summaries and submissions.' },
  { id: 'beat_planning', name: 'Beat Planning', category: 'Field Operations', description: 'Field route optimization and scheduled client routes.' },
];

export const MODULE_CATEGORIES = [
  'Core',
  'Administration',
  'Management',
  'Sales & CRM',
  'Field Operations',
  'Human Resources',
  'Communication',
  'Analytics',
];

export const getSystemModules = () => SYSTEM_MODULES;

export default {
  SYSTEM_MODULES,
  MODULE_CATEGORIES,
  getSystemModules,
};
