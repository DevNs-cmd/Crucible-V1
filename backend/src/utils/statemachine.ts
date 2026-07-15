import { LeadStatus } from '../models/lead.model';

// Explicitly define which statuses are allowed to move to which statuses
export const VALID_LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new:          ['contacted', 'closed_lost'],
  contacted:    ['proposal', 'closed_lost'],
  proposal:     ['negotiation', 'closed_lost'],
  negotiation:  ['closed_won', 'closed_lost'],
  closed_won:   [],   // terminal — no transitions out
  closed_lost:  [],   // terminal — no transitions out
};

/**
 * Validates whether a lead status transition is structurally permitted.
 * @returns true if valid, false otherwise.
 */
export function isValidTransition(currentStatus: LeadStatus, nextStatus: LeadStatus): boolean {
  // A no-op (currentStatus === nextStatus) should NOT be treated as automatically valid — return false
  if (currentStatus === nextStatus) return false;

  const allowedTransitions = VALID_LEAD_TRANSITIONS[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(nextStatus) : false;
}
