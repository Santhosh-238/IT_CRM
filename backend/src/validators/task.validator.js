import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Medium'),
  status: z.enum(['Todo', 'In Progress', 'Completed', 'Cancelled']).optional().default('Todo'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();
