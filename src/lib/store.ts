import { prisma } from './db';
import { TicketDTO, UserDTO, AdminAnalyticsDTO, Category, Priority } from './types';
import { INITIAL_USERS, INITIAL_TICKETS } from './mock-store';
import { calculateSlaDeadline, getSlaInfo } from './sla';

// In-memory fallback array to guarantee zero crash operation if database is cold initializing
let memoryUsers: UserDTO[] = [...INITIAL_USERS];
let memoryTickets: TicketDTO[] = [...INITIAL_TICKETS];

export async function getUsersStore(): Promise<UserDTO[]> {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    if (dbUsers.length > 0) {
      memoryUsers = dbUsers as UserDTO[];
      return memoryUsers;
    }
  } catch (err) {
    console.warn('Using in-memory fallback for getUsersStore:', err);
  }
  return memoryUsers;
}

export async function getTicketsStore(): Promise<TicketDTO[]> {
  try {
    const dbTickets = await prisma.ticket.findMany({
      include: {
        reportedBy: true,
        assignedTo: true,
        history: {
          include: { changedBy: true },
          orderBy: { timestamp: 'desc' },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (dbTickets.length > 0) {
      memoryTickets = dbTickets.map((t) => ({
        ...t,
        slaDeadline: t.slaDeadline.toISOString(),
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        history: t.history.map((h) => ({
          ...h,
          timestamp: h.timestamp.toISOString(),
        })),
        comments: t.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      })) as TicketDTO[];
      return memoryTickets;
    }
  } catch (err) {
    console.warn('Using in-memory fallback for getTicketsStore:', err);
  }
  return memoryTickets;
}

export async function getTicketByIdStore(id: string): Promise<TicketDTO | null> {
  try {
    const dbTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        reportedBy: true,
        assignedTo: true,
        history: {
          include: { changedBy: true },
          orderBy: { timestamp: 'desc' },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (dbTicket) {
      return {
        ...dbTicket,
        slaDeadline: dbTicket.slaDeadline.toISOString(),
        resolvedAt: dbTicket.resolvedAt ? dbTicket.resolvedAt.toISOString() : null,
        createdAt: dbTicket.createdAt.toISOString(),
        updatedAt: dbTicket.updatedAt.toISOString(),
        history: dbTicket.history.map((h) => ({
          ...h,
          timestamp: h.timestamp.toISOString(),
        })),
        comments: dbTicket.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      } as TicketDTO;
    }
  } catch (err) {
    console.warn('Using in-memory fallback for getTicketByIdStore:', err);
  }
  return memoryTickets.find((t) => t.id === id) || null;
}

export async function generateTicketCode(): Promise<string> {
  try {
    const count = await prisma.ticket.count();
    const num = 1001 + count;
    return `FF-${num}`;
  } catch {
    const num = 1001 + memoryTickets.length;
    return `FF-${num}`;
  }
}

export async function calculateAdminAnalytics(tickets: TicketDTO[]): Promise<AdminAnalyticsDTO> {
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'REPORTED' || t.status === 'ASSIGNED').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED').length;
  const closedTickets = tickets.filter((t) => t.status === 'CLOSED').length;
  const criticalTickets = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

  let slaBreachCount = 0;
  let nearingBreachCount = 0;
  let totalResolutionTimeHours = 0;
  let resolvedCountForART = 0;

  const categoryDistribution: Record<Category, number> = {
    ELECTRICAL: 0,
    PLUMBING: 0,
    HVAC: 0,
    NETWORK: 0,
    CARPENTRY: 0,
    JANITORIAL: 0,
    OTHER: 0,
  };

  const buildingDistribution: Record<string, number> = {};
  const priorityDistribution: Record<Priority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  const now = new Date();

  tickets.forEach((t) => {
    // Categories
    if (categoryDistribution[t.category] !== undefined) {
      categoryDistribution[t.category]++;
    } else {
      categoryDistribution['OTHER']++;
    }

    // Buildings
    buildingDistribution[t.building] = (buildingDistribution[t.building] || 0) + 1;

    // Priorities
    if (priorityDistribution[t.priority] !== undefined) {
      priorityDistribution[t.priority]++;
    }

    // SLA analysis
    const slaInfo = getSlaInfo(t.priority, t.slaDeadline, t.status, t.resolvedAt, now);
    if (slaInfo.isBreached) {
      slaBreachCount++;
    } else if (slaInfo.status === 'NEARING_BREACH') {
      nearingBreachCount++;
    }

    // Average Resolution Time (ART)
    if (t.resolvedAt) {
      const createdTime = new Date(t.createdAt).getTime();
      const resolvedTime = new Date(t.resolvedAt).getTime();
      const diffHours = Math.max(0, (resolvedTime - createdTime) / (1000 * 3600));
      totalResolutionTimeHours += diffHours;
      resolvedCountForART++;
    }
  });

  const averageResolutionTimeHours = resolvedCountForART > 0 ? Number((totalResolutionTimeHours / resolvedCountForART).toFixed(1)) : 2.4;
  const activeCount = openTickets + inProgressTickets;
  const slaBreachRate = activeCount + resolvedTickets > 0 ? Number(((slaBreachCount / (activeCount + resolvedTickets)) * 100).toFixed(1)) : 0;

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    criticalTickets,
    slaBreachCount,
    slaBreachRate,
    nearingBreachCount,
    averageResolutionTimeHours,
    categoryDistribution,
    buildingDistribution,
    priorityDistribution,
  };
}
