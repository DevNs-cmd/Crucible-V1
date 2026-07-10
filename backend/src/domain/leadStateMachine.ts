import { LeadStatus } from '../models/lead.model';

const transitions: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'closed_lost'],
  contacted: ['proposal', 'closed_lost'],
  proposal: ['negotiation', 'closed_lost'],
  negotiation: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
};

/** Verify if a transition from current lead status to next lead status is valid. */
export function isValidTransition(current: LeadStatus, next: LeadStatus): boolean {
  if (current === next) return true;
  return transitions[current]?.includes(next) ?? false;
}
