export type Role = 'CITIZEN' | 'STAFF' | 'ADMIN';

export type Category = 
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HVAC'
  | 'NETWORK'
  | 'CARPENTRY'
  | 'JANITORIAL'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 
  | 'REPORTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  phone?: string | null;
}

export interface TicketDTO {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  building: string;
  floor: string;
  room: string;
  photoUrl?: string | null;
  resolutionProofUrl?: string | null;
  reportedById: string;
  reportedBy?: UserDTO;
  assignedToId?: string | null;
  assignedTo?: UserDTO | null;
  slaDeadline: string | Date;
  resolvedAt?: string | Date | null;
  rating?: number | null;
  feedback?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  history?: TicketHistoryDTO[];
  comments?: TicketCommentDTO[];
}

export interface TicketHistoryDTO {
  id: string;
  ticketId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  changedById: string;
  changedBy?: UserDTO;
  note?: string | null;
  timestamp: string | Date;
}

export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  authorId: string;
  author?: UserDTO;
  message: string;
  isInternal: boolean;
  createdAt: string | Date;
}

export interface AdminAnalyticsDTO {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  criticalTickets: number;
  slaBreachCount: number;
  slaBreachRate: number; // percentage 0-100
  nearingBreachCount: number; // < 1 hour left
  averageResolutionTimeHours: number;
  categoryDistribution: Record<Category, number>;
  buildingDistribution: Record<string, number>;
  priorityDistribution: Record<Priority, number>;
}
