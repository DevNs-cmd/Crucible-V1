/** Represents a row in the `meetings` table. */
export interface Meeting {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  met_at: string;
  outcome: string | null;
  notes: string | null;
  created_at: string;
}
