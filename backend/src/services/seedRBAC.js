import { prisma } from '../config/prisma.js';

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

export const DEFAULT_ROLES = [
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrator with full access to all modules',
    isSystem: true,
    appType: 'admin',
    permissions: SYSTEM_MODULES.map((m) => ({
      moduleId: m.id,
      moduleName: m.name,
      category: m.category,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      canApprove: true,
    })),
  },
  {
    name: 'Management',
    slug: 'management',
    description: 'Executive management with cross-departmental oversight and approvals',
    isSystem: false,
    appType: 'manager',
    permissions: SYSTEM_MODULES.map((m) => ({
      moduleId: m.id,
      moduleName: m.name,
      category: m.category,
      canView: true,
      canCreate: ['Core', 'Management', 'Sales & CRM'].includes(m.category),
      canEdit: ['Core', 'Management', 'Sales & CRM'].includes(m.category),
      canDelete: ['Sales & CRM'].includes(m.category),
      canExport: true,
      canApprove: true,
    })),
  },
  {
    name: 'ASM CBE',
    slug: 'asm_cbe',
    description: 'Area Sales Manager for Coimbatore Territory',
    isSystem: false,
    appType: 'manager',
    permissions: SYSTEM_MODULES.map((m) => {
      const allowed = ['dashboard', 'calendar', 'daily_working_plan', 'attendance', 'area_dashboard', 'contacts', 'companies', 'leads', 'deals', 'client_visits', 'daily_reports'];
      return {
        moduleId: m.id,
        moduleName: m.name,
        category: m.category,
        canView: allowed.includes(m.id),
        canCreate: allowed.includes(m.id),
        canEdit: allowed.includes(m.id),
        canDelete: false,
        canExport: allowed.includes(m.id),
        canApprove: ['daily_working_plan', 'leads', 'deals', 'leave_management'].includes(m.id),
      };
    }),
  },
  {
    name: 'SO',
    slug: 'so',
    description: 'Sales Officer managing direct client sales and daily field operations',
    isSystem: false,
    appType: 'sales_employee',
    permissions: SYSTEM_MODULES.map((m) => {
      const allowed = ['dashboard', 'employee_dashboard', 'calendar', 'daily_working_plan', 'attendance', 'contacts', 'companies', 'leads', 'client_visits', 'daily_reports'];
      return {
        moduleId: m.id,
        moduleName: m.name,
        category: m.category,
        canView: allowed.includes(m.id),
        canCreate: allowed.includes(m.id),
        canEdit: allowed.includes(m.id),
        canDelete: false,
        canExport: false,
        canApprove: false,
      };
    }),
  },
  {
    name: 'SO Madurai',
    slug: 'so_madurai',
    description: 'Sales Officer dedicated to Madurai territory accounts',
    isSystem: false,
    appType: 'sales_employee',
    permissions: SYSTEM_MODULES.map((m) => {
      const allowed = ['dashboard', 'employee_dashboard', 'calendar', 'daily_working_plan', 'attendance', 'contacts', 'companies', 'leads', 'client_visits', 'daily_reports'];
      return {
        moduleId: m.id,
        moduleName: m.name,
        category: m.category,
        canView: allowed.includes(m.id),
        canCreate: allowed.includes(m.id),
        canEdit: allowed.includes(m.id),
        canDelete: false,
        canExport: false,
        canApprove: false,
      };
    }),
  },
];

/**
 * Seed or update default RBAC roles and permissions
 */
export async function seedRBAC() {
  console.log('[RBAC Seeder] Initializing default roles and permission matrices...');

  try {
    const roleIdMap = {};

    for (const roleDef of DEFAULT_ROLES) {
      let role = await prisma.role.findUnique({
        where: { slug: roleDef.slug },
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleDef.name,
            slug: roleDef.slug,
            description: roleDef.description,
            isSystem: roleDef.isSystem,
            appType: roleDef.appType,
          },
        });
        console.log(`[RBAC Seeder] Created role: ${role.name}`);
      } else {
        await prisma.role.update({
          where: { id: role.id },
          data: {
            name: roleDef.name,
            description: roleDef.description,
            isSystem: roleDef.isSystem,
            appType: roleDef.appType,
          },
        });
      }

      roleIdMap[roleDef.slug] = role.id;

      // Upsert permissions for this role
      for (const perm of roleDef.permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_moduleId: {
              roleId: role.id,
              moduleId: perm.moduleId,
            },
          },
          update: {
            moduleName: perm.moduleName,
            category: perm.category,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
            canExport: perm.canExport,
            canApprove: perm.canApprove,
          },
          create: {
            roleId: role.id,
            moduleId: perm.moduleId,
            moduleName: perm.moduleName,
            category: perm.category,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
            canExport: perm.canExport,
            canApprove: perm.canApprove,
          },
        });
      }
    }

    // Configure role hierarchy (Parent-Child links)
    // Admin -> Management -> ASM CBE -> SO; and Management -> SO Madurai
    if (roleIdMap['admin'] && roleIdMap['management']) {
      await prisma.role.update({
        where: { id: roleIdMap['management'] },
        data: { parentRoleId: roleIdMap['admin'] },
      });
    }
    if (roleIdMap['management'] && roleIdMap['asm_cbe']) {
      await prisma.role.update({
        where: { id: roleIdMap['asm_cbe'] },
        data: { parentRoleId: roleIdMap['management'] },
      });
    }
    if (roleIdMap['management'] && roleIdMap['so_madurai']) {
      await prisma.role.update({
        where: { id: roleIdMap['so_madurai'] },
        data: { parentRoleId: roleIdMap['management'] },
      });
    }
    if (roleIdMap['asm_cbe'] && roleIdMap['so']) {
      await prisma.role.update({
        where: { id: roleIdMap['so'] },
        data: { parentRoleId: roleIdMap['asm_cbe'] },
      });
    }

    // Seed sample team users matching screenshots if few users exist
    const userCount = await prisma.user.count();
    if (userCount < 6) {
      const sampleUsers = [
        { name: 'Janusika R', email: 'rjanusa09@gmail.com', phone: '9994999744', roleSlug: 'admin', dept: 'Administration' },
        { name: 'Venus Admin', email: 'venusadmin@gmail.com', phone: '9876543210', roleSlug: 'admin', dept: 'Administration' },
        { name: 'Banupriya', email: 'banubalasri@gmail.com', phone: '9843956702', roleSlug: 'management', dept: 'Management' },
        { name: 'Murugesan', email: 'kmurugesan.venus@gmail.com', phone: '9994999344', roleSlug: 'management', dept: 'Management' },
        { name: 'Prakash', email: 'rp2308@gmail.com', phone: '8939731418', roleSlug: 'management', dept: 'Management' },
        { name: 'Gokulnath', email: 'gokul.sales@gmail.com', phone: '9843112233', roleSlug: 'management', dept: 'Management' },
        { name: 'Karthik Raja', email: 'karthik.cbe@gmail.com', phone: '9789012345', roleSlug: 'asm_cbe', dept: 'Coimbatore Area' },
        { name: 'Senthil Kumar', email: 'senthil.so@gmail.com', phone: '9876501234', roleSlug: 'so', dept: 'Field Sales' },
        { name: 'Dinesh Babu', email: 'dinesh.so@gmail.com', phone: '9843210987', roleSlug: 'so', dept: 'Field Sales' },
        { name: 'Vigneshwaran', email: 'vicky.so@gmail.com', phone: '9789123456', roleSlug: 'so', dept: 'Field Sales' },
        { name: 'Saravanan M', email: 'saravanan.mdu@gmail.com', phone: '9944123456', roleSlug: 'so_madurai', dept: 'Madurai Area' },
        { name: 'Manikandan P', email: 'mani.mdu@gmail.com', phone: '9944234567', roleSlug: 'so_madurai', dept: 'Madurai Area' },
        { name: 'Ramesh K', email: 'ramesh.mdu@gmail.com', phone: '9944345678', roleSlug: 'so_madurai', dept: 'Madurai Area' },
        { name: 'Balaji S', email: 'balaji.mdu@gmail.com', phone: '9944456789', roleSlug: 'so_madurai', dept: 'Madurai Area' },
        { name: 'Vijay Anand', email: 'vijay.mdu@gmail.com', phone: '9944567890', roleSlug: 'so_madurai', dept: 'Madurai Area' },
      ];

      for (const u of sampleUsers) {
        const roleId = roleIdMap[u.roleSlug];
        if (!roleId) continue;

        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
          await prisma.user.create({
            data: {
              name: u.name,
              email: u.email,
              phone: u.phone,
              passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',
              role: u.roleSlug.toUpperCase(),
              roleId,
              department: u.dept,
            },
          });
        } else {
          await prisma.user.update({
            where: { email: u.email },
            data: { roleId, role: u.roleSlug.toUpperCase(), phone: u.phone, department: u.dept },
          });
        }
      }
    }

    console.log('[RBAC Seeder] Roles, permissions & team assignments synchronized.');
    return { success: true, message: 'RBAC successfully synchronized.' };
  } catch (error) {
    console.error('[RBAC Seeder Error]', error);
    return { success: false, error: error.message };
  }
}
