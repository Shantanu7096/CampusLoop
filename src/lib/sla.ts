import { Priority, TicketStatus } from './types';

export const SLA_HOURS: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48,
};

/**
 * Calculates the exact SLA deadline date based on priority and creation time.
 */
export function calculateSlaDeadline(priority: Priority, createdAt: Date = new Date()): Date {
  const hours = SLA_HOURS[priority] || 24;
  const deadline = new Date(createdAt.getTime());
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export type SlaStatus = 'ON_TRACK' | 'NEARING_BREACH' | 'BREACHED' | 'RESOLVED_ON_TIME' | 'RESOLVED_LATE';

export interface SlaInfo {
  status: SlaStatus;
  hoursRemaining: number;
  minutesRemaining: number;
  formattedRemaining: string;
  isBreached: boolean;
}

/**
 * Evaluates the SLA status for a given ticket.
 */
export function getSlaInfo(
  priority: Priority,
  slaDeadline: string | Date,
  ticketStatus: TicketStatus,
  resolvedAt?: string | Date | null,
  nowDate: Date = new Date()
): SlaInfo {
  const deadline = new Date(slaDeadline);
  const resolved = resolvedAt ? new Date(resolvedAt) : null;

  // Terminal states (RESOLVED or CLOSED)
  if (ticketStatus === 'RESOLVED' || ticketStatus === 'CLOSED') {
    const endPoint = resolved || nowDate;
    const isLate = endPoint.getTime() > deadline.getTime();
    return {
      status: isLate ? 'RESOLVED_LATE' : 'RESOLVED_ON_TIME',
      hoursRemaining: 0,
      minutesRemaining: 0,
      formattedRemaining: isLate ? 'SLA Breached before completion' : 'Completed within SLA',
      isBreached: isLate,
    };
  }

  const diffMs = deadline.getTime() - nowDate.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) {
    const overdueMinutes = Math.abs(totalMinutes);
    const overdueHours = Math.floor(overdueMinutes / 60);
    const mins = overdueMinutes % 60;
    return {
      status: 'BREACHED',
      hoursRemaining: 0,
      minutesRemaining: 0,
      formattedRemaining: `Overdue by ${overdueHours}h ${mins}m`,
      isBreached: true,
    };
  }

  const remainingMins = totalMinutes % 60;
  if (totalHours < 1) {
    return {
      status: 'NEARING_BREACH',
      hoursRemaining: totalHours,
      minutesRemaining: remainingMins,
      formattedRemaining: `${remainingMins} mins remaining`,
      isBreached: false,
    };
  }

  return {
    status: 'ON_TRACK',
    hoursRemaining: totalHours,
    minutesRemaining: remainingMins,
    formattedRemaining: `${totalHours}h ${remainingMins}m remaining`,
    isBreached: false,
  };
}
