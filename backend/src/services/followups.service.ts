import { supabase } from '../config/database';
import { FollowUp } from '../models/followup.model';
import { CreateFollowUpInput } from '../utils/validators';
import { recordActivity } from './activityLog.service';

/** All follow-ups for a lead, ordered by due date. */
export async function getFollowUpsByLeadId(leadId: string): Promise<FollowUp[]> {
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .eq('lead_id', leadId)
    .order('due_at', { ascending: true });

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return (data as FollowUp[]) ?? [];
}

/** Create a follow-up task for a lead. */
export async function createFollowUp(
  leadId: string,
  userId: string,
  input: CreateFollowUpInput
): Promise<FollowUp> {
  const { data, error } = await supabase
    .from('followups')
    .insert({
      lead_id: leadId,
      user_id: userId,
      due_at: input.due_at,
      description: input.description,
      completed: false,
    })
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 400 });

  recordActivity({
    entity_type: 'followup',
    entity_id: data.id,
    action: 'create',
    actor_id: userId,
    before_state: null,
    after_state: data,
  });

  return data as FollowUp;
}

/** Mark a follow-up as completed. */
export async function completeFollowUp(leadId: string, followUpId: string, actorId?: string): Promise<FollowUp> {
  const { data: beforeState } = await supabase
    .from('followups')
    .select('*')
    .eq('id', followUpId)
    .eq('lead_id', leadId)
    .single();

  const { data, error } = await supabase
    .from('followups')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', followUpId)
    .eq('lead_id', leadId)
    .select()
    .single();

  if (error || !data) throw Object.assign(new Error('Follow-up not found'), { status: 404 });

  recordActivity({
    entity_type: 'followup',
    entity_id: followUpId,
    action: 'update',
    actor_id: actorId,
    before_state: beforeState,
    after_state: data,
  });

  return data as FollowUp;
}

export interface OverdueFollowUp {
  id: string;
  leadName: string;
  company: string;
  dueAt: string;
  assignedToEmail: string;
  description: string;
}

/** All overdue incomplete follow-ups — used by daily cron job. */
export async function getOverdueFollowUps(): Promise<OverdueFollowUp[]> {
  const { data, error } = await supabase
    .from('followups')
    .select('id, due_at, description, leads!inner(full_name, company), users:user_id(email)')
    .lte('due_at', new Date().toISOString())
    .eq('completed', false);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  return (data ?? []).map((row: Record<string, unknown>) => {
    const lead = row['leads'] as { full_name: string; company: string } | null;
    const user = row['users'] as { email: string } | null;
    return {
      id: row['id'] as string,
      leadName: lead?.full_name ?? 'Unknown',
      company: lead?.company ?? 'Unknown',
      dueAt: row['due_at'] as string,
      assignedToEmail: user?.email ?? '',
      description: row['description'] as string,
    };
  });
}
