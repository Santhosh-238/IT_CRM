import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// -------------------------------------------------------------
// 1. MASTER PROJECT CATALOG (MODULE-WISE CONFIGURATION) SERVICES
// -------------------------------------------------------------

// Helper to map real CRM projects (or master templates) to standard catalog format
function mapProjectToMasterCatalog(p) {
  const modules = Array.isArray(p.modules) ? p.modules : [];
  const totalModulePrice = modules.reduce((acc, m) => acc + (Number(m.price) || 45000), 0);
  const basePrice = p.basePrice || p.estimatedBudget || p.actualCost || (totalModulePrice > 0 ? totalModulePrice : 180000);

  return {
    id: p.id,
    projectCode: p.projectId || p.projectCode || `PRJ-${(p.name || 'PRJ').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}`,
    name: p.name,
    category: p.category || (p.projectType && p.projectType !== 'Fixed Price' ? p.projectType : 'Full-Stack Web Development'),
    projectType: p.projectType || 'Fixed Price',
    basePrice,
    currency: p.currency || 'INR',
    defaultDuration: p.startDate && p.targetEndDate ? `${p.startDate} - ${p.targetEndDate}` : (p.defaultDuration || '60 Days'),
    techStack: Array.isArray(p.teamMembers) && p.teamMembers.length > 0 ? p.teamMembers : (Array.isArray(p.techStack) && p.techStack.length > 0 ? p.techStack : ['React', 'Node.js', 'PostgreSQL']),
    description: p.description || (p.clientName ? `Active project for ${p.clientName}. Project Lead: ${p.projectManagerName || 'Santhosh'}` : 'Enterprise software project'),
    status: p.status === 'In Progress' ? 'Active' : (p.status || 'Active'),
    clientName: p.clientName || '',
    projectManagerName: p.projectManagerName || '',
    progress: p.progress || 0,
    modules: modules.map((m, idx) => ({
      id: m.id || `mod-${idx + 1}`,
      name: m.name || `Module ${idx + 1}`,
      code: m.code || `MOD-0${idx + 1}`,
      description: m.description || `Assigned to: ${m.assignedTo || 'Unassigned'} • Progress: ${m.progress ?? 0}% • Status: ${m.status || 'Active'}`,
      durationDays: Number(m.durationDays) || (m.deadline ? 14 : 7),
      priority: m.priority || 'Medium',
      isCore: m.isCore !== undefined ? Boolean(m.isCore) : true,
      deliverables: Array.isArray(m.deliverables) && m.deliverables.length > 0 ? m.deliverables : [m.status || 'Active', `Assigned: ${m.assignedTo || 'Team'}`],
      price: Number(m.price) || 35000,
    })),
    deliverables: Array.isArray(p.deliverables) && p.deliverables.length > 0 ? p.deliverables : ['UI & Wireframes', 'Backend APIs', 'PostgreSQL Database', 'Deployment'],
    icon: p.icon || 'folders',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Get all master projects dynamically from prisma.masterProject (ONLY projects added by user)
 */
export async function getMasterProjectsService(query = {}) {
  const { search } = query;

  const masterProjects = await prisma.masterProject.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let results = masterProjects.map((m, idx) => ({
    id: m.id,
    projectCode: m.projectCode || `PRJ-${String(idx + 1).padStart(2, '0')}`,
    name: m.name,
    modules: Array.isArray(m.modules) ? m.modules : [],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    results = results.filter((p) => {
      const matchName = p.name.toLowerCase().includes(s);
      const matchCode = (p.projectCode || '').toLowerCase().includes(s);
      const matchModules = Array.isArray(p.modules) && p.modules.some((mod) => {
        const modName = typeof mod === 'string' ? mod : (mod.name || '');
        return modName.toLowerCase().includes(s);
      });
      return matchName || matchCode || matchModules;
    });
  }

  return results;
}

/**
 * Get a single master project by ID
 */
export async function getMasterProjectByIdService(id) {
  const master = await prisma.masterProject.findFirst({
    where: { OR: [{ id }, { projectCode: id }] },
  });
  if (master) {
    return {
      id: master.id,
      projectCode: master.projectCode,
      name: master.name,
      modules: Array.isArray(master.modules) ? master.modules : [],
      createdAt: master.createdAt,
      updatedAt: master.updatedAt,
    };
  }

  throw new Error('Project template not found in catalog');
}

/**
 * Create a new master project with modules dynamically
 */
export async function createMasterProjectService(data, userId = null) {
  let { projectCode, name, modules } = data;

  if (!name || !name.trim()) {
    throw new Error('Project name is required');
  }

  const count = await prisma.masterProject.count();
  if (!projectCode) {
    projectCode = `PRJ-${String(count + 1).padStart(2, '0')}`;
  }

  // Sanitize modules: clean array of { id, name }
  const formattedModules = Array.isArray(modules)
    ? modules.map((m, idx) => {
        if (typeof m === 'string') {
          return { id: `mod-${Date.now()}-${idx}`, name: m.trim() };
        }
        return {
          id: m.id || `mod-${Date.now()}-${idx}`,
          name: (m.name || '').trim(),
        };
      }).filter((m) => Boolean(m.name))
    : [];

  const newProject = await prisma.masterProject.create({
    data: {
      projectCode,
      name: name.trim(),
      category: 'General',
      projectType: 'Fixed Price',
      basePrice: 0,
      currency: 'INR',
      status: 'Active',
      modules: formattedModules,
      createdBy: userId,
    },
  });

  return {
    id: newProject.id,
    projectCode: newProject.projectCode,
    name: newProject.name,
    modules: newProject.modules,
    createdAt: newProject.createdAt,
    updatedAt: newProject.updatedAt,
  };
}

/**
 * Update an existing master project and its modules dynamically
 */
export async function updateMasterProjectService(id, data) {
  const existingMaster = await prisma.masterProject.findFirst({
    where: { OR: [{ id }, { projectCode: id }] },
  });

  if (!existingMaster) {
    throw new Error('Project template not found');
  }

  const updatePayload = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();

  if (Array.isArray(data.modules)) {
    updatePayload.modules = data.modules.map((m, idx) => {
      if (typeof m === 'string') {
        return { id: `mod-${Date.now()}-${idx}`, name: m.trim() };
      }
      return {
        id: m.id || `mod-${Date.now()}-${idx}`,
        name: (m.name || '').trim(),
      };
    }).filter((m) => Boolean(m.name));
  }

  const updated = await prisma.masterProject.update({
    where: { id: existingMaster.id },
    data: updatePayload,
  });

  return {
    id: updated.id,
    projectCode: updated.projectCode,
    name: updated.name,
    modules: updated.modules,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Delete a master project dynamically
 */
export async function deleteMasterProjectService(id) {
  await prisma.masterProject.deleteMany({
    where: { OR: [{ id }, { projectCode: id }] },
  });

  return { success: true };
}

// -------------------------------------------------------------
// 2. SYSTEM SETTINGS (COMPANY PROFILE, CRM PIPELINE, SECURITY)
// -------------------------------------------------------------

/**
 * Retrieve a system setting by key (e.g. "company_profile")
 */
export const DEFAULT_NOTIFICATION_PRESETS = {
  dailyDigest: true,
  leadAssignment: true,
  projectMilestones: true,
  meetingReminders: true,
  inAppMentions: true,
  securityAlerts: true,
  soundAlerts: false,
  desktopBanners: true,
  digestTime: '09:00 AM',
  frequency: 'instant',
};

export async function getSettingService(key) {
  let setting = await prisma.systemSetting.findUnique({
    where: { settingKey: key },
  });

  if (!setting) {
    let defaultValue = {};
    if (key === 'notifications') defaultValue = DEFAULT_NOTIFICATION_PRESETS;
    else if (key === 'company_profile') defaultValue = typeof DEFAULT_COMPANY_PROFILE !== 'undefined' ? DEFAULT_COMPANY_PROFILE : {};
    else if (key === 'crm_pipeline') defaultValue = typeof DEFAULT_CRM_PRESETS !== 'undefined' ? DEFAULT_CRM_PRESETS : {};
    else if (key === 'security_settings') defaultValue = typeof DEFAULT_SECURITY_PRESETS !== 'undefined' ? DEFAULT_SECURITY_PRESETS : {};

    setting = await prisma.systemSetting.create({
      data: {
        settingKey: key,
        value: defaultValue,
      },
    });
  }

  if (key === 'notifications') {
    const rawValue = setting?.value && typeof setting.value === 'object' && !Array.isArray(setting.value)
      ? setting.value
      : {};
    return { ...DEFAULT_NOTIFICATION_PRESETS, ...rawValue };
  }

  return setting?.value ?? {};
}

/**
 * Save or update a system setting
 */
export async function saveSettingService(key, value, userId = null) {
  const existing = await prisma.systemSetting.findUnique({
    where: { settingKey: key },
  });

  const existingValue = existing?.value && typeof existing.value === 'object' && !Array.isArray(existing.value)
    ? existing.value
    : (key === 'notifications' ? DEFAULT_NOTIFICATION_PRESETS : {});

  const mergedValue = (value && typeof value === 'object' && !Array.isArray(value))
    ? { ...existingValue, ...value }
    : value;

  const updated = await prisma.systemSetting.upsert({
    where: { settingKey: key },
    update: {
      value: mergedValue,
      updatedBy: userId,
    },
    create: {
      settingKey: key,
      value: mergedValue,
      updatedBy: userId,
    },
  });

  return updated.value;
}

/**
 * Reset settings key to factory defaults
 */
export async function resetSettingService(key) {
  let defaultValue = {};
  if (key === 'notifications') defaultValue = DEFAULT_NOTIFICATION_PRESETS;
  else if (key === 'company_profile') defaultValue = typeof DEFAULT_COMPANY_PROFILE !== 'undefined' ? DEFAULT_COMPANY_PROFILE : {};
  else if (key === 'crm_pipeline') defaultValue = typeof DEFAULT_CRM_PRESETS !== 'undefined' ? DEFAULT_CRM_PRESETS : {};
  else if (key === 'security_settings') defaultValue = typeof DEFAULT_SECURITY_PRESETS !== 'undefined' ? DEFAULT_SECURITY_PRESETS : {};

  const updated = await prisma.systemSetting.upsert({
    where: { settingKey: key },
    update: { value: defaultValue },
    create: { settingKey: key, value: defaultValue },
  });

  return updated.value;
}

// -------------------------------------------------------------
// 3. REALTIME USER PROFILE ("MY PROFILE")
// -------------------------------------------------------------

/**
 * Retrieve real-time User Profile for Settings "My Profile" tab from PostgreSQL
 */
export async function getUserProfileService(authUser = null) {
  let user = null;
  if (authUser?.id) {
    user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, name: true, email: true, phone: true, role: true, department: true, avatar: true, createdAt: true, updatedAt: true },
    });
  }

  // Fallback to active SUPER_ADMIN user
  if (!user) {
    user = (await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, name: true, email: true, phone: true, role: true, department: true, avatar: true, createdAt: true, updatedAt: true },
    })) || (await prisma.user.findFirst({
      select: { id: true, name: true, email: true, phone: true, role: true, department: true, avatar: true, createdAt: true, updatedAt: true },
    }));
  }

  if (!user) {
    throw new Error('No user found in database.');
  }

  // Query linked employee record if present
  const employee = await prisma.employee.findFirst({
    where: { email: user.email },
  });

  // Query custom user settings if saved
  const userSetting = await prisma.systemSetting.findUnique({
    where: { settingKey: `user_profile_${user.id}` },
  });
  const custom = userSetting?.value || {};

  const nameParts = (user.name || '').trim().split(' ');
  const firstName = custom.firstName || nameParts[0] || 'Santhosh';
  const lastName = custom.lastName !== undefined ? custom.lastName : (nameParts.slice(1).join(' ') || '');

  return {
    id: user.id,
    name: user.name || `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email: user.email,
    phone: user.phone || employee?.phone || custom.phone || '',
    role: user.role || 'SUPER_ADMIN',
    designation: custom.designation || (user.role === 'SUPER_ADMIN' ? 'Super Administrator' : (employee?.designation || user.role)),
    department: employee?.department || user.department || custom.department || 'Engineering',
    empCode: employee?.empCode || 'EMP-1001',
    workLocation: employee?.workLocation || custom.workLocation || 'Chennai HQ',
    address: employee?.address || custom.address || '',
    city: custom.city || 'Chennai',
    state: custom.state || 'Tamil Nadu',
    country: custom.country || 'India',
    zip: custom.zip || '600113',
    bio: custom.bio || `${(user.role === 'SUPER_ADMIN' ? 'Super Administrator' : (employee?.designation || user.role))} • Engineering`,
    avatar: user.avatar || custom.avatar || '',
    passwordUpdatedAt: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
    accountCreatedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
  };
}

/**
 * Update real-time User Profile in PostgreSQL database (User + Employee tables)
 */
export async function updateUserProfileService(authUser, data) {
  let user = null;
  if (authUser?.id) {
    user = await prisma.user.findUnique({ where: { id: authUser.id } });
  }
  if (!user) {
    user = (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })) || (await prisma.user.findFirst());
  }
  if (!user) {
    throw new Error('User not found.');
  }

  const firstName = data.firstName !== undefined ? data.firstName.trim() : '';
  const lastName = data.lastName !== undefined ? data.lastName.trim() : '';
  const fullName = data.name ? data.name.trim() : `${firstName} ${lastName}`.trim();

  // 1. Update User in DB
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: fullName || user.name,
      phone: data.phone !== undefined ? data.phone : user.phone,
      department: data.department !== undefined ? data.department : user.department,
      avatar: data.avatar !== undefined ? data.avatar : user.avatar,
    },
    select: { id: true, name: true, email: true, phone: true, role: true, department: true, avatar: true },
  });

  // 2. Update Employee if matching email exists
  const employee = await prisma.employee.findFirst({
    where: { email: user.email },
  });

  if (employee) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        name: fullName || employee.name,
        phone: data.phone !== undefined ? data.phone : employee.phone,
        department: data.department !== undefined ? data.department : employee.department,
        designation: data.designation !== undefined ? data.designation : employee.designation,
        address: data.address !== undefined ? data.address : employee.address,
        workLocation: data.workLocation !== undefined ? data.workLocation : employee.workLocation,
      },
    });
  }

  // 3. Save extended profile details (bio, city, state, country, zip, etc.)
  const customData = {
    firstName: firstName || fullName.split(' ')[0],
    lastName: lastName || fullName.split(' ').slice(1).join(' '),
    phone: data.phone !== undefined ? data.phone : updatedUser.phone,
    designation: data.designation || employee?.designation || updatedUser.role,
    department: data.department || updatedUser.department,
    workLocation: data.workLocation || employee?.workLocation || 'Chennai HQ',
    address: data.address || employee?.address || '',
    city: data.city || 'Chennai',
    state: data.state || 'Tamil Nadu',
    country: data.country || 'India',
    zip: data.zip || '600113',
    bio: data.bio || '',
    avatar: data.avatar || updatedUser.avatar || '',
  };

  await prisma.systemSetting.upsert({
    where: { settingKey: `user_profile_${user.id}` },
    update: { value: customData, updatedBy: user.id },
    create: { settingKey: `user_profile_${user.id}`, value: customData, updatedBy: user.id },
  });

  return await getUserProfileService(updatedUser);
}

/**
 * Change user password securely with verification
 */
export async function changePasswordService(authUser, { currentPassword, newPassword }) {
  let user = null;
  if (authUser?.id) {
    user = await prisma.user.findUnique({ where: { id: authUser.id } });
  }
  if (!user) {
    user = (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })) || (await prisma.user.findFirst());
  }
  if (!user) throw new Error('User not found.');

  if (!currentPassword || !newPassword) {
    throw new Error('Please provide both current and new passwords.');
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password does not match.');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true, message: 'Password updated successfully!' };
}

/**
 * Fetch real security audit logs for the current user/system from PostgreSQL
 */
export async function getSecurityAuditLogsService(limit = 4) {
  const logs = await prisma.accessAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      targetType: true,
      targetName: true,
      userName: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action.replace(/_/g, ' '),
    target: log.targetName ? `${log.targetType}: ${log.targetName}` : log.targetType,
    user: log.userName || 'Administrator',
    ip: log.ipAddress === '::1' || log.ipAddress === '127.0.0.1' ? 'Localhost (Secure)' : log.ipAddress,
    time: new Date(log.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
}

// -------------------------------------------------------------
// 6. CALENDAR & CONFIDENTIAL REMINDERS SERVICES
// -------------------------------------------------------------

const DEFAULT_REMINDERS = [
  {
    id: 'rem-init-1',
    title: 'Enterprise Contract Review & Signature',
    date: new Date().toISOString().split('T')[0], // Today!
    time: '11:00 AM',
    priority: 'High',
    category: 'Client Follow-up',
    notes: 'Confirm final SLA terms with TechCorp Solutions lead stakeholder.',
    completed: false,
    createdById: 'admin',
    createdByName: 'Santhosh C',
    createdByRole: 'SUPER_ADMIN',
    assignedToId: 'super-admin',
    assignedToName: 'Super Administrator',
    isSuperAdminOnly: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-init-2',
    title: 'Monthly Security & Access Audit',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow!
    time: '03:30 PM',
    priority: 'Medium',
    category: 'Internal Task',
    notes: 'Verify employee role assignments and active API token expirations.',
    completed: false,
    createdById: 'admin',
    createdByName: 'Santhosh C',
    createdByRole: 'SUPER_ADMIN',
    assignedToId: 'super-admin',
    assignedToName: 'Super Administrator',
    isSuperAdminOnly: true,
    createdAt: new Date().toISOString(),
  },
];

async function getStoredReminders() {
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'calendar_reminders' },
  });

  if (!setting || !Array.isArray(setting?.value)) {
    await prisma.systemSetting.upsert({
      where: { settingKey: 'calendar_reminders' },
      update: { value: DEFAULT_REMINDERS },
      create: { settingKey: 'calendar_reminders', value: DEFAULT_REMINDERS },
    });
    return DEFAULT_REMINDERS;
  }

  return Array.isArray(setting?.value) ? setting.value : DEFAULT_REMINDERS;
}

async function saveStoredReminders(reminders, userId = null) {
  const updated = await prisma.systemSetting.upsert({
    where: { settingKey: 'calendar_reminders' },
    update: { value: reminders, updatedBy: userId },
    create: { settingKey: 'calendar_reminders', value: reminders, updatedBy: userId },
  });
  return Array.isArray(updated?.value) ? updated.value : [];
}

/**
 * Get all reminders visible to the user:
 * Strict RBAC:
 * - SUPER_ADMIN: Can view all reminders
 * - Others: ONLY reminders created by or assigned to them (matching user id, employee id, email, or name)
 */
export async function getRemindersService(user) {
  const allReminders = await getStoredReminders();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user || user.role === 'admin';

  if (isSuperAdmin) {
    return allReminders;
  }

  // Look up employee record linked to user
  let employeeId = null;
  if (user?.email) {
    const emp = await prisma.employee.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' } },
    });
    if (emp) employeeId = emp.id;
  }

  // Filter strictly for this specific user
  return allReminders.filter((rem) => {
    const isCreator =
      rem.createdById === user.id ||
      (user.email && rem.createdByEmail && rem.createdByEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.name && rem.createdByName && rem.createdByName.toLowerCase() === user.name.toLowerCase());

    const isAssigned =
      rem.assignedToId === user.id ||
      rem.assignedUserId === user.id ||
      (employeeId && (rem.assignedEmployeeId === employeeId || rem.assignedToId === employeeId)) ||
      (user.email && rem.assignedToEmail && rem.assignedToEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.name && rem.assignedToName && rem.assignedToName.toLowerCase() === user.name.toLowerCase());

    return isCreator || isAssigned;
  });
}

/**
 * Create a new reminder
 * Auto-resolves assigned employee & user so both Employee and Admin see it dynamically
 */
export async function createReminderService(user, data) {
  if (!data.title || !data.date) {
    throw new Error('Reminder title and date are required.');
  }

  const allReminders = await getStoredReminders();

  let assignedUserId = data.assignedUserId || null;
  let assignedEmployeeId = data.assignedEmployeeId || null;
  let assignedToEmail = data.assignedToEmail || '';
  let assignedToName = data.assignedToName || 'Super Administrator';

  // If a specific team member is selected (not Super Administrator)
  if (assignedToName && assignedToName !== 'Super Administrator') {
    // 1. Check in Employee table
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          { name: { equals: assignedToName, mode: 'insensitive' } },
          ...(assignedToEmail ? [{ email: { equals: assignedToEmail, mode: 'insensitive' } }] : []),
          ...(data.assignedToId ? [{ id: data.assignedToId }] : []),
        ],
      },
    });

    if (emp) {
      assignedEmployeeId = emp.id;
      assignedToName = emp.name;
      if (!assignedToEmail && emp.email) assignedToEmail = emp.email;
    }

    // 2. Check in User table
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(assignedToEmail ? [{ email: { equals: assignedToEmail, mode: 'insensitive' } }] : []),
          { name: { equals: assignedToName, mode: 'insensitive' } },
          ...(data.assignedToId ? [{ id: data.assignedToId }] : []),
        ],
      },
    });

    if (targetUser) {
      assignedUserId = targetUser.id;
      if (!assignedToEmail && targetUser.email) assignedToEmail = targetUser.email;
      if (!assignedToName && targetUser.name) assignedToName = targetUser.name;
    }
  }

  const newReminder = {
    id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: data.title.trim(),
    date: data.date,
    time: data.time || '10:00 AM',
    priority: data.priority || 'Medium',
    category: data.category || 'General',
    notes: data.notes || '',
    completed: false,
    createdById: user?.id || 'admin',
    createdByName: user?.name || 'Santhosh C',
    createdByRole: user?.role || 'SUPER_ADMIN',
    createdByEmail: user?.email || '',
    assignedToId: assignedUserId || assignedEmployeeId || data.assignedToId || null,
    assignedUserId: assignedUserId || null,
    assignedEmployeeId: assignedEmployeeId || null,
    assignedToName: assignedToName,
    assignedToEmail: assignedToEmail,
    isSuperAdminOnly: !assignedToName || assignedToName === 'Super Administrator',
    createdAt: new Date().toISOString(),
  };

  const updatedList = [newReminder, ...allReminders];
  await saveStoredReminders(updatedList, user?.id);

  return newReminder;
}

/**
 * Update an existing reminder
 */
export async function updateReminderService(user, id, data) {
  const allReminders = await getStoredReminders();
  const index = allReminders.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error('Reminder not found.');
  }

  const existing = allReminders[index];
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user || user.role === 'admin';

  let employeeId = null;
  if (user?.email) {
    const emp = await prisma.employee.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' } },
    });
    if (emp) employeeId = emp.id;
  }

  const isCreator =
    existing.createdById === user?.id ||
    (user?.email && existing.createdByEmail && existing.createdByEmail.toLowerCase() === user.email.toLowerCase()) ||
    (user?.name && existing.createdByName && existing.createdByName.toLowerCase() === user.name.toLowerCase());

  const isAssigned =
    existing.assignedToId === user?.id ||
    existing.assignedUserId === user?.id ||
    (employeeId && (existing.assignedEmployeeId === employeeId || existing.assignedToId === employeeId)) ||
    (user?.email && existing.assignedToEmail && existing.assignedToEmail.toLowerCase() === user.email.toLowerCase()) ||
    (user?.name && existing.assignedToName && existing.assignedToName.toLowerCase() === user.name.toLowerCase());

  // Permission check
  if (!isSuperAdmin && !isCreator && !isAssigned) {
    throw new Error('Unauthorized to modify this confidential reminder.');
  }

  const updatedReminder = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  allReminders[index] = updatedReminder;
  await saveStoredReminders(allReminders, user?.id);

  return updatedReminder;
}

/**
 * Delete a reminder
 */
export async function deleteReminderService(user, id) {
  const allReminders = await getStoredReminders();
  const existing = allReminders.find((r) => r.id === id);

  if (!existing) {
    throw new Error('Reminder not found.');
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user || user.role === 'admin';

  if (!isSuperAdmin && existing.createdById !== user?.id) {
    throw new Error('Unauthorized to delete this reminder.');
  }

  const filtered = allReminders.filter((r) => r.id !== id);
  await saveStoredReminders(filtered, user?.id);

  return { success: true, message: 'Reminder deleted successfully.' };
}

/**
 * Get due reminders for notifications (Due today or overdue)
 */
export async function getDueRemindersService(user) {
  const userReminders = await getRemindersService(user);
  const todayStr = new Date().toISOString().split('T')[0];

  return userReminders.filter((rem) => !rem.completed && rem.date <= todayStr);
}
