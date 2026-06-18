import { supabase } from '../config/database';
import { Note } from '../models/note.model';
import { CreateNoteInput } from '../utils/validators';

/** All notes for a lead, newest first. */
export async function getNotesByLeadId(leadId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return (data as Note[]) ?? [];
}

/** Create a note on a lead. */
export async function createNote(
  leadId: string,
  authorId: string,
  input: CreateNoteInput
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ lead_id: leadId, author_id: authorId, content: input.content })
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 400 });
  return data as Note;
}

/** Delete a specific note scoped to its lead. */
export async function deleteNote(leadId: string, noteId: string): Promise<void> {
  const { error, count } = await supabase
    .from('notes')
    .delete({ count: 'exact' })
    .eq('id', noteId)
    .eq('lead_id', leadId);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  if (count === 0) throw Object.assign(new Error('Note not found'), { status: 404 });
}
