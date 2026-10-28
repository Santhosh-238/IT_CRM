import { prisma } from '../config/prisma.js';

/**
 * 1. Get all tasks with optional filters
 */
export async function getTasksService(queryParams = {}) {
  const { status, priority, assignedTo, search } = queryParams;

  const where = {};
  if (status && status !== 'All') where.status = status;
  if (priority && priority !== 'All') where.priority = priority;
  if (assignedTo && assignedTo !== 'All') where.assignedTo = assignedTo;

  let tasks = [];
  if (prisma.task) {
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  return tasks;
}

/**
 * 2. Get task by ID
 */
export async function getTaskByIdService(id) {
  if (!prisma.task) {
    const error = new Error('Task model not configured');
    error.status = 404;
    throw error;
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  return task;
}

/**
 * 3. Create a new task
 */
export async function createTaskService(body) {
  const { title, description, priority, dueDate, assignedTo, contactId, leadId } = body;
  if (!title || !title.trim()) {
    const error = new Error('Task title is required');
    error.status = 400;
    throw error;
  }

  if (!prisma.task) {
    return {
      id: `tsk-${Date.now()}`,
      title: title.trim(),
      description: description || '',
      priority: priority || 'Medium',
      status: 'Todo',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      createdAt: new Date(),
    };
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

  return task;
}

/**
 * 4. Update an existing task
 */
export async function updateTaskService(id, body) {
  if (!prisma.task) {
    return { id, ...body };
  }

  const task = await prisma.task.update({
    where: { id },
    data: body,
  });

  return task;
}

/**
 * 5. Delete a task
 */
export async function deleteTaskService(id) {
  if (prisma.task) {
    await prisma.task.delete({ where: { id } });
  }

  return { id };
}

export default {
  getTasksService,
  getTaskByIdService,
  createTaskService,
  updateTaskService,
  deleteTaskService,
};
