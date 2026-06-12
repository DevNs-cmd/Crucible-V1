import { supabase } from '../config/database';
import { Lead, LeadWithRelations, LeadStatus } from '../models/lead.model';
import { CreateLeadInput, UpdateLeadInput } from '../utils/validators';
import { PaginationParams } from '../utils/pagination';

export interface LeadFilters {
  status?: LeadStatus;
  assigned_to?: string;
}

export interface PaginatedLeads {
  leads: Lead[];
  total: number;
}

/**
 * Fetch a paginated, filtered list of non-deleted leads.
 */
export async function getLeads(
  filters: LeadFilters,
  pagination: PaginationParams
): Promise<PaginatedLeads> {
  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw Object.assign(new Error(error.message), { status: 500 });
  }

  return { leads: (data as Lead[]) ?? [], total: count ?? 0 };
}

/**
 * Create a new lead record.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      email: input.email.toLowerCase().trim(),
      status: input.status ?? 'new',
    })
    .select()
    .single();

  if (error) {
    throw Object.assign(new Error(error.message), { status: 400 });
  }

  return data as Lead;
}

/**
 * Fetch a single lead with its notes, meetings, and followups.
 */
export async function getLeadById(id: string): Promise<LeadWithRelations> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      notes(*),
      meetings(*),
      followups(*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Lead not found'), { status: 404 });
  }

  return data as LeadWithRelations;
}

/**
 * Update lead fields (partial update).
 */
export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Lead not found or update failed'), { status: 404 });
  }

  return data as Lead;
}

/**
 * Soft delete a lead by setting deleted_at.
 */
export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    throw Object.assign(new Error('Lead not found or delete failed'), { status: 404 });
  }
}

/**
 * Update only the status of a lead.
 * Returns both the updated lead and the previous status (for webhooks).
 */
export async function updateLeadStatus(
  id: string,
  newStatus: LeadStatus
): Promise<{ lead: Lead; oldStatus: LeadStatus }> {
  // Fetch current status first
  const { data: current, error: fetchError } = await supabase
    .from('leads')
    .select('status')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !current) {
    throw Object.assign(new Error('Lead not found'), { status: 404 });
  }

  const oldStatus = current.status as LeadStatus;

  const { data, error } = await supabase
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Status update failed'), { status: 500 });
  }

  return { lead: data as Lead, oldStatus };
}
