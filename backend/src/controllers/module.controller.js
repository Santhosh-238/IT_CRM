import { prisma } from '../config/prisma.js';
import { SYSTEM_MODULES } from '../services/seedRBAC.js';
import { delCache } from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';

/**
 * Get all system modules and custom modules
 * GET /api/modules
 */
export async function getModules(req, res) {
  try {
    const { category, search } = req.query;

    const dbPermissions = await prisma.rolePermission.findMany({
      select: {
        moduleId: true,
        moduleName: true,
        category: true,
      },
      distinct: ['moduleId'],
    });

    const moduleMap = new Map();

    for (const sysMod of SYSTEM_MODULES) {
      moduleMap.set(sysMod.id, {
        id: sysMod.id,
        name: sysMod.name,
        category: sysMod.category || 'Core',
        description: sysMod.description || '',
        isSystem: true,
      });
    }

    for (const p of dbPermissions) {
      if (!moduleMap.has(p.moduleId)) {
        moduleMap.set(p.moduleId, {
          id: p.moduleId,
          name: p.moduleName,
          category: p.category || 'Custom',
          description: `Custom module: ${p.moduleName}`,
          isSystem: false,
        });
      } else {
        const existing = moduleMap.get(p.moduleId);
        existing.name = p.moduleName || existing.name;
        existing.category = p.category || existing.category;
      }
    }

    let allModules = Array.from(moduleMap.values());

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

    return res.json({
      success: true,
      count: allModules.length,
      categories,
      modules: allModules,
    });
  } catch (error) {
    console.error('[Get Modules Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve modules: ' + error.message,
    });
  }
}

/**
 * Get distinct module categories
 * GET /api/modules/categories
 */
export async function getModuleCategories(_req, res) {
  try {
    const dbCategories = await prisma.rolePermission.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const sysCategories = SYSTEM_MODULES.map((m) => m.category);
    const allCategories = Array.from(
      new Set([...sysCategories, ...dbCategories.map((c) => c.category).filter(Boolean)])
    ).sort();

    return res.json({
      success: true,
      categories: allCategories,
    });
  } catch (error) {
    console.error('[Get Module Categories Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch module categories: ' + error.message,
    });
  }
}

/**
 * Get module by ID
 * GET /api/modules/:id
 */
export async function getModuleById(req, res) {
  try {
    const { id } = req.params;
    const cleanId = String(id).toLowerCase().trim();

    const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);

    const dbPerm = await prisma.rolePermission.findFirst({
      where: { moduleId: cleanId },
      select: { moduleId: true, moduleName: true, category: true },
    });

    if (!sysMod && !dbPerm) {
      return res.status(404).json({
        success: false,
        message: `Module '${id}' not found.`,
      });
    }

    const moduleData = {
      id: sysMod ? sysMod.id : dbPerm.moduleId,
      name: dbPerm?.moduleName || sysMod?.name,
      category: dbPerm?.category || sysMod?.category || 'Custom',
      description: sysMod?.description || `Custom module: ${dbPerm?.moduleName}`,
      isSystem: Boolean(sysMod),
    };

    return res.json({
      success: true,
      module: moduleData,
    });
  } catch (error) {
    console.error('[Get Module By ID Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve module: ' + error.message,
    });
  }
}

/**
 * Create a new custom system/application module
 * POST /api/modules
 */
export async function createModule(req, res) {
  try {
    const { name, category, description, permissionsByRole } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Module name is required.',
      });
    }

    const cleanName = name.trim();
    const cleanCategory = category && category.trim() ? category.trim() : 'Custom';
    const cleanDesc = description && description.trim() ? description.trim() : `Custom module for ${cleanName}`;

    const moduleId = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module name. Could not generate valid module ID.',
      });
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
      return res.status(400).json({
        success: false,
        message: `A module with name '${cleanName}' or ID '${moduleId}' already exists.`,
      });
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
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'MODULE_CREATED',
        targetType: 'Module',
        targetName: cleanName,
        details: `Created new module '${cleanName}' (ID: ${moduleId}) in category '${cleanCategory}' with permissions auto-provisioned across ${allRoles.length} roles.`,
        ipAddress: req.ip,
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

    return res.status(201).json({
      success: true,
      message: `Module '${cleanName}' created successfully and provisioned to ${allRoles.length} roles.`,
      module: newModule,
    });
  } catch (error) {
    console.error('[Create Module Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create module: ' + error.message,
    });
  }
}

/**
 * Update module metadata
 * PUT /api/modules/:id
 */
export async function updateModule(req, res) {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const cleanId = String(id).toLowerCase().trim();

    const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);
    if (sysMod) {
      return res.status(403).json({
        success: false,
        message: `System module '${sysMod.name}' cannot be modified.`,
      });
    }

    const existing = await prisma.rolePermission.findFirst({
      where: { moduleId: cleanId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Custom module '${id}' not found.`,
      });
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
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'MODULE_UPDATED',
        targetType: 'Module',
        targetName: updateData.moduleName || existing.moduleName,
        details: `Updated custom module '${cleanId}'.`,
        ipAddress: req.ip,
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Module '${cleanId}' updated successfully.`,
      module: {
        id: cleanId,
        name: updateData.moduleName || existing.moduleName,
        category: updateData.category || existing.category,
      },
    });
  } catch (error) {
    console.error('[Update Module Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update module: ' + error.message,
    });
  }
}

/**
 * Delete a custom module
 * DELETE /api/modules/:id
 */
export async function deleteModule(req, res) {
  try {
    const { id } = req.params;
    const cleanId = String(id).toLowerCase().trim();

    const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);
    if (sysMod) {
      return res.status(403).json({
        success: false,
        message: `System module '${sysMod.name}' is essential to CRM core operations and cannot be deleted.`,
      });
    }

    const count = await prisma.rolePermission.count({
      where: { moduleId: cleanId },
    });

    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: `Custom module '${id}' not found.`,
      });
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
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Administrator',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'MODULE_DELETED',
        targetType: 'Module',
        targetName: cleanId,
        details: `Deleted custom module '${cleanId}' and cleaned up ${count} role permission entries.`,
        ipAddress: req.ip,
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Custom module '${cleanId}' deleted successfully.`,
    });
  } catch (error) {
    console.error('[Delete Module Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete module: ' + error.message,
    });
  }
}

export default {
  getModules,
  getModuleCategories,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
};
