import { TicketStatus, Role } from './types';

export interface StateTransitionRequest {
  currentStatus: TicketStatus;
  targetStatus: TicketStatus;
  userRole: Role;
  assignedToId?: string | null;
  resolutionProofUrl?: string | null;
  note?: string | null;
}

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  REPORTED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'REPORTED'],
  IN_PROGRESS: ['RESOLVED', 'ASSIGNED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

/**
 * Validates whether a requested state transition is compliant with the system FSM engine.
 */
export function validateStateTransition(
  req: StateTransitionRequest
): TransitionValidationResult {
  const { currentStatus, targetStatus, userRole, assignedToId, resolutionProofUrl, note } = req;

  // 1. Same status is a no-op
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // 2. Check graph adjacency
  const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!validNextStates.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Illegal state transition from ${currentStatus} to ${targetStatus}. Valid transitions are: ${validNextStates.join(', ') || 'None (terminal state)'}`,
    };
  }

  // 3. Specific state rules
  if (targetStatus === 'ASSIGNED') {
    if (!assignedToId) {
      return {
        allowed: false,
        reason: 'Ticket status cannot transition to ASSIGNED without selecting a valid maintenance staff member.',
      };
    }
  }

  if (targetStatus === 'IN_PROGRESS') {
    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Only assigned maintenance staff or facility admins can set ticket status to IN_PROGRESS.',
      };
    }
  }

  if (targetStatus === 'RESOLVED') {
    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Only maintenance staff or facility admins can mark tickets as RESOLVED.',
      };
    }
    if (!resolutionProofUrl || resolutionProofUrl.trim() === '') {
      return {
        allowed: false,
        reason: 'MANDATORY: Resolution photo proof URL is required when marking a ticket as RESOLVED.',
      };
    }
    if (!note || note.trim().length < 5) {
      return {
        allowed: false,
        reason: 'A descriptive resolution note (at least 5 characters) is required when marking as RESOLVED.',
      };
    }
  }

  if (targetStatus === 'CLOSED') {
    if (userRole !== 'CITIZEN' && userRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Only the reporting Citizen or a Facility Admin can close a resolved ticket.',
      };
    }
  }

  return { allowed: true };
}
