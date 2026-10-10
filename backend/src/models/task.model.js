import { prisma } from '../config/prisma.js';

/**
 * Dynamic Task Model
 * Handles enterprise CRM tasks and follow-up activities
 */
export class TaskModel {
  static async getUpcomingFollowUps() {
    return await prisma.contact.findMany({
      where: {
        nextFollowDate: { not: null },
      },
      select: {
        id: true,
        contactId: true,
        name: true,
        phone: true,
        status: true,
        nextFollowDate: true,
        assignedTo: true,
        assignedToName: true,
      },
      orderBy: { nextFollowDate: 'asc' },
      take: 20,
    });
  }
}

export const TASK_MODULE = {
  id: 'tasks',
  name: 'Tasks & Reminders',
  category: 'Sales & CRM',
  description: 'Team tasks, follow-up deadlines, and activity queues.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
};

export default TaskModel;
