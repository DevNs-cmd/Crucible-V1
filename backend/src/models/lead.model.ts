import { Note } from './note.model';
import { Meeting } from './meeting.model';
import { FollowUp } from './followup.model';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  status: LeadStatus;
  source: string | null;
  assigned_to: string | null;
  value: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadWithRelations extends Lead {
  notes?: Note[];
  meetings?: Meeting[];
  followups?: FollowUp[];
}
