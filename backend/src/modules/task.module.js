/**
 * Task Module Definition & Schema
 */
export const TASK_MODULE = {
  id: 'tasks',
  name: 'Tasks',
  category: 'Core',
  description: 'Team task tracking, assignment, due date monitoring, and workflow checklists.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
  },
  statuses: [
    'Todo',
    'In Progress',
    'Review',
    'Completed',
    'Blocked',
  ],
  priorities: [
    'High',
    'Medium',
    'Low',
  ],
  schema: {
    fields: ['id', 'title', 'description', 'priority', 'status', 'dueDate', 'assignedTo', 'contactId', 'leadId', 'createdAt', 'updatedAt'],
  },
};

export default TASK_MODULE;
