/** Valid lead status values. */
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

/** Represents a row in the `leads` table. */
export interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string;
  industry: string | null;
  status: LeadStatus;
  source: string | null;
  assigned_to: string | null;
  value: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Lead with related records joined. */
export interface LeadWithRelations extends Lead {
  notes?: import('./note.model').Note[];
  meetings?: import('./meeting.model').Meeting[];
  followups?: import('./followup.model').FollowUp[];
}
