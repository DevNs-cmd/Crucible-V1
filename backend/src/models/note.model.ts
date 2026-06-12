/** Represents a row in the `notes` table. */
export interface Note {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
}
