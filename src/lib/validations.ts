import { z } from 'zod';

export const CategoryEnum = z.enum([
  'ELECTRICAL',
  'PLUMBING',
  'HVAC',
  'NETWORK',
  'CARPENTRY',
  'JANITORIAL',
  'OTHER',
]);

export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const RoleEnum = z.enum(['CITIZEN', 'STAFF', 'ADMIN']);

export const TicketStatusEnum = z.enum([
  'REPORTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);

export const CreateTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  category: CategoryEnum,
  priority: PriorityEnum,
  building: z.string().min(1, 'Building location is required'),
  floor: z.string().min(1, 'Floor location is required'),
  room: z.string().min(1, 'Room location is required'),
  photoUrl: z.string().optional().nullable(),
  reportedById: z.string().min(1, 'Reporter ID is required'),
});

export const AssignTicketSchema = z.object({
  ticketId: z.string().min(1),
  assignedToId: z.string().min(1, 'Staff member must be selected'),
  assignedById: z.string().min(1),
  note: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  ticketId: z.string().min(1),
  newStatus: TicketStatusEnum,
  performedById: z.string().min(1),
  resolutionProofUrl: z.string().optional(),
  note: z.string().optional(),
});

export const CloseTicketSchema = z.object({
  ticketId: z.string().min(1),
  closedById: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

export const AddCommentSchema = z.object({
  ticketId: z.string().min(1),
  authorId: z.string().min(1),
  message: z.string().min(1, 'Comment message cannot be empty'),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type AssignTicketInput = z.infer<typeof AssignTicketSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type CloseTicketInput = z.infer<typeof CloseTicketSchema>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
