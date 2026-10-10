import { z } from 'zod';

export const createEmployeeSchema = z.object({
  empCode: z.string().optional(),
  name: z.string().min(1, 'Employee name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  role: z.string().optional(),
  joiningDate: z.string().optional(),
  workLocation: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();
