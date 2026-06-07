/** Represents a row in the `followups` table. */
export interface FollowUp {
  id: string;
  lead_id: string;
  user_id: string;
  due_at: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}
