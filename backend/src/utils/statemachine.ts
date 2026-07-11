import { LeadStatus } from '../models/lead.model';

// Explicitly define which statuses are allowed to move to which statuses
export const VALID_LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'closed_lost'],
  contacted: ['new', 'proposal', 'closed_lost'],
  proposal: ['contacted', 'negotiation', 'closed_lost'],
  negotiation: ['proposal', 'closed_won', 'closed_lost'],
  closed_won: ['contacted'], // Can re-open to contacted if new upsell or scope changes
  closed_lost: ['new', 'contacted'], // Can re-open if lead re-engages
};

/**
 * Validates whether a lead status transition is structurally permitted.
 * @returns true if valid, false otherwise.
 */
export function isValidTransition(currentStatus: LeadStatus, nextStatus: LeadStatus): boolean {
  // If the status isn't actually changing, it's always valid
  if (currentStatus === nextStatus) return true;

  const allowedTransitions = VALID_LEAD_TRANSITIONS[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(nextStatus) : false;
}