import { prisma } from '../config/prisma.js';
import { SYSTEM_MODULES } from '../modules/module.registry.js';
import { delCache } from '../config/redis.js';
import { logAuditEvent } from './auditService.js';
import { generateModuleId, mergeSystemAndDbModules } from '../utils/module.util.js';

/**
 * 1. Get all system modules and custom modules
 */
export async function getModulesService(queryParams = {}) {
  const { category, search } = queryParams;

  const dbPermissions = await prisma.rolePermission.findMany({
    select: {
      moduleId: true,
      moduleName: true,
      category: true,
    },
    distinct: ['moduleId'],
  });

  let allModules = mergeSystemAndDbModules(SYSTEM_MODULES, dbPermissions);

  if (category && category !== 'All') {
    allModules = allModules.filter(
      (m) => m.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allModules = allModules.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }

  const categories = Array.from(new Set(allModules.map((m) => m.category))).sort();

  return {
    count: allModules.length,
    categories,
    modules: allModules,
  };
}

/**
 * 2. Get distinct module categories
 */
export async function getModuleCategoriesService() {
  const dbCategories = await prisma.rolePermission.findMany({
    select: { category: true },
    distinct: ['category'],
  });

  const sysCategories = SYSTEM_MODULES.map((m) => m.category);
  const allCategories = Array.from(
    new Set([...sysCategories, ...dbCategories.map((c) => c.category).filter(Boolean)])
  ).sort();

  return { categories: allCategories };
}

/**
 * 3. Get module by ID
 */
export async function getModuleByIdService(id) {
  const cleanId = String(id).toLowerCase().trim();

  const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);

  const dbPerm = await prisma.rolePermission.findFirst({
    where: { moduleId: cleanId },
    select: { moduleId: true, moduleName: true, category: true },
  });

  if (!sysMod && !dbPerm) {
    const error = new Error(`Module '${id}' not found.`);
    error.status = 404;
    throw error;
  }

  const moduleData = {
    id: sysMod ? sysMod.id : dbPerm.moduleId,
    name: dbPerm?.moduleName || sysMod?.name,
    category: dbPerm?.category || sysMod?.category || 'Custom',
    description: sysMod?.description || `Custom module: ${dbPerm?.moduleName}`,
    isSystem: Boolean(sysMod),
  };

  return { module: moduleData };
}

/**
 * 4. Create a new custom system/application module
 */
export async function createModuleService(body, user, ip = '127.0.0.1') {
  const { name, category, description, permissionsByRole } = body;

  if (!name || !name.trim()) {
    const error = new Error('Module name is required.');
    error.status = 400;
    throw error;
  }

  const cleanName = name.trim();
  const cleanCategory = category && category.trim() ? category.trim() : 'Custom';
  const cleanDesc = description && description.trim() ? description.trim() : `Custom module for ${cleanName}`;

  const moduleId = generateModuleId(cleanName);

  if (!moduleId) {
    const error = new Error('Invalid module name. Could not generate valid module ID.');
    error.status = 400;
    throw error;
  }

  const existingSysMod = SYSTEM_MODULES.find(
    (m) => m.id.toLowerCase() === moduleId || m.name.toLowerCase() === cleanName.toLowerCase()
  );

  const existingDbPerm = await prisma.rolePermission.findFirst({
    where: {
      OR: [
        { moduleId },
        { moduleName: { equals: cleanName, mode: 'insensitive' } },
      ],
    },
  });

  if (existingSysMod || existingDbPerm) {
    const error = new Error(`A module with name '${cleanName}' or ID '${moduleId}' already exists.`);
    error.status = 400;
    throw error;
  }

  const allRoles = await prisma.role.findMany({
    select: { id: true, slug: true, isSystem: true },
  });

  const permissionInserts = allRoles.map((role) => {
    const isSuperAdmin =
      role.slug.toLowerCase().includes('admin') ||
      role.slug.toLowerCase().includes('super');

    const customRolePerm = permissionsByRole ? permissionsByRole[role.id] || permissionsByRole[role.slug] : null;

    return {
      roleId: role.id,
      moduleId,
      moduleName: cleanName,
      category: cleanCategory,
      canView: customRolePerm?.canView !== undefined ? customRolePerm.canView : isSuperAdmin,
      canCreate: customRolePerm?.canCreate !== undefined ? customRolePerm.canCreate : isSuperAdmin,
      canEdit: customRolePerm?.canEdit !== undefined ? customRolePerm.canEdit : isSuperAdmin,
      canDelete: customRolePerm?.canDelete !== undefined ? customRolePerm.canDelete : isSuperAdmin,
      canExport: customRolePerm?.canExport !== undefined ? customRolePerm.canExport : isSuperAdmin,
      canApprove: customRolePerm?.canApprove !== undefined ? customRolePerm.canApprove : isSuperAdmin,
    };
  });

  if (permissionInserts.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionInserts,
      skipDuplicates: true,
    });
  }

  try {
    await delCache('crm:permissions:*');
    await delCache('crm:roles:*');
  } catch (e) {}

  try {
    await logAuditEvent({
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'SUPER_ADMIN',
      action: 'MODULE_CREATED',
      targetType: 'Module',
      targetName: cleanName,
      details: `Created new module '${cleanName}' (ID: ${moduleId}) in category '${cleanCategory}' with permissions auto-provisioned across ${allRoles.length} roles.`,
      ipAddress: ip,
    });
  } catch (e) {}

  const newModule = {
    id: moduleId,
    name: cleanName,
    category: cleanCategory,
    description: cleanDesc,
    isSystem: false,
    provisionedRolesCount: allRoles.length,
  };

  return {
    message: `Module '${cleanName}' created successfully and provisioned to ${allRoles.length} roles.`,
    module: newModule,
  };
}

/**
 * 5. Update custom module metadata
 */
export async function updateModuleService(id, body, user, ip = '127.0.0.1') {
  const { name, category } = body;
  const cleanId = String(id).toLowerCase().trim();

  const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);
  if (sysMod) {
    const error = new Error(`System module '${sysMod.name}' cannot be modified.`);
    error.status = 403;
    throw error;
  }

  const existing = await prisma.rolePermission.findFirst({
    where: { moduleId: cleanId },
  });

  if (!existing) {
    const error = new Error(`Custom module '${id}' not found.`);
    error.status = 404;
    throw error;
  }

  const updateData = {};
  if (name && name.trim()) updateData.moduleName = name.trim();
  if (category && category.trim()) updateData.category = category.trim();

  await prisma.rolePermission.updateMany({
    where: { moduleId: cleanId },
    data: updateData,
  });

  try {
    await delCache('crm:permissions:*');
    await delCache('crm:roles:*');
  } catch (e) {}

  try {
    await logAuditEvent({
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'SUPER_ADMIN',
      action: 'MODULE_UPDATED',
      targetType: 'Module',
      targetName: updateData.moduleName || existing.moduleName,
      details: `Updated custom module '${cleanId}'.`,
      ipAddress: ip,
    });
  } catch (e) {}

  return {
    message: `Module '${cleanId}' updated successfully.`,
    module: {
      id: cleanId,
      name: updateData.moduleName || existing.moduleName,
      category: updateData.category || existing.category,
    },
  };
}

/**
 * 6. Delete a custom module
 */
export async function deleteModuleService(id, user, ip = '127.0.0.1') {
  const cleanId = String(id).toLowerCase().trim();

  const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);
  if (sysMod) {
    const error = new Error(`System module '${sysMod.name}' is essential to CRM core operations and cannot be deleted.`);
    error.status = 403;
    throw error;
  }

  const count = await prisma.rolePermission.count({
    where: { moduleId: cleanId },
  });

  if (count === 0) {
    const error = new Error(`Custom module '${id}' not found.`);
    error.status = 404;
    throw error;
  }

  await prisma.rolePermission.deleteMany({
    where: { moduleId: cleanId },
  });

  try {
    await delCache('crm:permissions:*');
    await delCache('crm:roles:*');
  } catch (e) {}

  try {
    await logAuditEvent({
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'SUPER_ADMIN',
      action: 'MODULE_DELETED',
      targetType: 'Module',
      targetName: cleanId,
      details: `Deleted custom module '${cleanId}' and cleaned up ${count} role permission entries.`,
      ipAddress: ip,
    });
  } catch (e) {}

  return {
    message: `Custom module '${cleanId}' deleted successfully.`,
  };
}

export default {
  getModulesService,
  getModuleCategoriesService,
  getModuleByIdService,
  createModuleService,
  updateModuleService,
  deleteModuleService,
};
