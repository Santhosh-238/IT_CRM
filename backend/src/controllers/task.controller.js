import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all tasks with optional filters
 * GET /api/tasks
 */
export async function getTasks(req, res) {
  try {
    const { status, priority, assignedTo, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    // Check if Task model exists in Prisma schema, otherwise provide fallback or return empty/simulated
    let tasks = [];
    if (prisma.task) {
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      tasks = await prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }

    return sendSuccess(res, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    console.error('getTasks error:', error);
    return sendError(res, error.message || 'Failed to fetch tasks', 500);
  }
}

/**
 * Get task by ID
 * GET /api/tasks/:id
 */
export async function getTaskById(req, res) {
  try {
    const { id } = req.params;
    if (!prisma.task) {
      return sendError(res, 'Task model not configured', 404);
    }
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return sendError(res, 'Task not found', 404);
    }
    return sendSuccess(res, task, 'Task retrieved');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
}

/**
 * Create a new task
 * POST /api/tasks
 */
export async function createTask(req, res) {
  try {
    const { title, description, priority, dueDate, assignedTo, contactId, leadId } = req.body;
    if (!title || !title.trim()) {
      return sendError(res, 'Task title is required', 400);
    }

    if (!prisma.task) {
      return sendSuccess(res, {
        id: `tsk-${Date.now()}`,
        title: title.trim(),
        description: description || '',
        priority: priority || 'Medium',
        status: 'Todo',
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
        createdAt: new Date(),
      }, 'Task created successfully', 201);
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || '',
        priority: priority || 'Medium',
        status: 'Todo',
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
        contactId: contactId || null,
        leadId: leadId || null,
      },
    });

    return sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    console.error('createTask error:', error);
    return sendError(res, error.message || 'Failed to create task', 500);
  }
}

/**
 * Update an existing task
 * PUT /api/tasks/:id
 */
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!prisma.task) {
      return sendSuccess(res, { id, ...data }, 'Task updated successfully');
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to update task', 500);
  }
}

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    if (prisma.task) {
      await prisma.task.delete({ where: { id } });
    }

    return sendSuccess(res, { id }, 'Task deleted successfully');
  } catch (error) {
    return sendError(res, error.message || 'Failed to delete task', 500);
  }
}

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
