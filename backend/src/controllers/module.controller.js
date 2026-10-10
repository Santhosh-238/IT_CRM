import * as moduleService from '../services/module.service.js';

/**
 * Get all system modules and custom modules
 * GET /api/modules
 */
export async function getModules(req, res) {
  try {
    const result = await moduleService.getModulesService(req.query);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Get Modules Error]', error);
    return res.status(error.status || 500).json({
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
    const result = await moduleService.getModuleCategoriesService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Get Module Categories Error]', error);
    return res.status(error.status || 500).json({
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
    const result = await moduleService.getModuleByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Get Module By ID Error]', error);
    return res.status(error.status || 500).json({
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
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await moduleService.createModuleService(req.body, req.user, ip);
    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Create Module Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create module',
    });
  }
}

/**
 * Update module metadata
 * PUT /api/modules/:id
 */
export async function updateModule(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await moduleService.updateModuleService(req.params.id, req.body, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Update Module Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update module',
    });
  }
}

/**
 * Delete a custom module
 * DELETE /api/modules/:id
 */
export async function deleteModule(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await moduleService.deleteModuleService(req.params.id, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Delete Module Error]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete module',
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
