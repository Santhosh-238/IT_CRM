import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  phone: z.string().min(3, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  source: z.string().optional(),
  contactType: z.string().optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  stage: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();
