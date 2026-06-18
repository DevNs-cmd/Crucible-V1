import { supabase } from '../config/database';
import { Meeting } from '../models/meeting.model';
import { CreateMeetingInput } from '../utils/validators';

/** All meetings for a lead, newest first. */
export async function getMeetingsByLeadId(leadId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('lead_id', leadId)
    .order('met_at', { ascending: false });

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return (data as Meeting[]) ?? [];
}

/** Log a new meeting for a lead. */
export async function createMeeting(
  leadId: string,
  userId: string,
  input: CreateMeetingInput
): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      lead_id: leadId,
      user_id: userId,
      title: input.title,
      met_at: input.met_at,
      outcome: input.outcome ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 400 });
  return data as Meeting;
}
