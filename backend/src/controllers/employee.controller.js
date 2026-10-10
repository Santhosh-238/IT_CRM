import * as employeeService from '../services/employee.service.js';

/**
 * 1. Get all employees with optional filtering, search, and Redis caching
 * GET /api/employees
 */
export async function getEmployees(req, res) {
  try {
    const result = await employeeService.getEmployeesService(req.query);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in getEmployees:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Get Single Employee by ID
 * GET /api/employees/:id
 */
export async function getEmployeeById(req, res) {
  try {
    const result = await employeeService.getEmployeeByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Get Employee Statistics & Department KPIs
 * GET /api/employees/stats
 */
export async function getEmployeeStats(_req, res) {
  try {
    const result = await employeeService.getEmployeeStatsService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Create New Employee & User Account
 * POST /api/employees
 */
export async function createEmployee(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await employeeService.createEmployeeService(req.body, req.user, ip);
    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Update Employee Details
 * PUT /api/employees/:id
 */
export async function updateEmployee(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await employeeService.updateEmployeeService(req.params.id, req.body, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Update Employee Status
 * PATCH /api/employees/:id/status
 */
export async function updateEmployeeStatus(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await employeeService.updateEmployeeStatusService(req.params.id, req.body?.status, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 7. Delete Employee Record
 * DELETE /api/employees/:id
 */
export async function deleteEmployee(req, res) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await employeeService.deleteEmployeeService(req.params.id, req.user, ip);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export default {
  getEmployees,
  getEmployeeById,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
};
