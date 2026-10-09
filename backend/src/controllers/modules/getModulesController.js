import { prisma } from '../../config/prisma.js';
import { SYSTEM_MODULES } from '../../services/seedRBAC.js';

/**
 * Get all system modules and custom modules
 * GET /api/modules
 */
export async function getModules(req, res) {
  try {
    const { category, search } = req.query;

    // 1. Fetch all distinct modules registered in database RolePermission table
    const dbPermissions = await prisma.rolePermission.findMany({
      select: {
        moduleId: true,
        moduleName: true,
        category: true,
      },
      distinct: ['moduleId'],
    });

    // 2. Map system modules
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

    // 3. Add or merge database modules
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

    // 4. Filter by category if requested
    if (category && category !== 'All') {
      allModules = allModules.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 5. Search filter if requested
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allModules = allModules.filter(
        (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      );
    }

    // 6. Group categories
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

    // Check system modules first
    const sysMod = SYSTEM_MODULES.find((m) => m.id.toLowerCase() === cleanId);

    // Check database permissions
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
