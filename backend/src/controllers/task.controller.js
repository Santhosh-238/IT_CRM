import * as taskService from '../services/task.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all tasks with optional filters
 * GET /api/tasks
 */
export async function getTasks(req, res) {
  try {
    const tasks = await taskService.getTasksService(req.query);
    return sendSuccess(res, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    console.error('getTasks error:', error);
    return sendError(res, error.message || 'Failed to fetch tasks', error.status || 500);
  }
}

/**
 * Get task by ID
 * GET /api/tasks/:id
 */
export async function getTaskById(req, res) {
  try {
    const task = await taskService.getTaskByIdService(req.params.id);
    return sendSuccess(res, task, 'Task retrieved');
  } catch (error) {
    return sendError(res, error.message, error.status || 500);
  }
}

/**
 * Create a new task
 * POST /api/tasks
 */
export async function createTask(req, res) {
  try {
    const task = await taskService.createTaskService(req.body);
    return sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    console.error('createTask error:', error);
    return sendError(res, error.message || 'Failed to create task', error.status || 500);
  }
}

/**
 * Update an existing task
 * PUT /api/tasks/:id
 */
export async function updateTask(req, res) {
  try {
    const task = await taskService.updateTaskService(req.params.id, req.body);
    return sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to update task', error.status || 500);
  }
}

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export async function deleteTask(req, res) {
  try {
    const result = await taskService.deleteTaskService(req.params.id);
    return sendSuccess(res, result, 'Task deleted successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to delete task', error.status || 500);
  }
}

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
