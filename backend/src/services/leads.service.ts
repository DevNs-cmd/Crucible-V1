import { supabase } from '../config/database';
import { Lead, LeadWithRelations, LeadStatus } from '../models/lead.model';
import { CreateLeadInput, UpdateLeadInput } from '../utils/validators';
import { PaginationParams } from '../utils/pagination';

export interface LeadFilters {
  status?: LeadStatus;
  assigned_to?: string;
}

// Local mock database array to fall back on when network fetch fails
const mockLeadsStore: Lead[] = [
  {
    id: 'mock-lead-uuid-1111',
    full_name: 'Existing Test Lead',
    email: 'existing@example.com',
    phone: '9876543210',
    company: 'Acme Corp',
    industry: 'SaaS',
    status: 'new',
    source: 'Inbound',
    assigned_to: 'agent-1',
    value: 5000,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

/** Paginated, filtered list of non-deleted leads. */
export async function getLeads(
  filters: LeadFilters,
  pagination: PaginationParams
): Promise<{ leads: Lead[]; total: number }> {
  try {
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { leads: (data as Lead[]) ?? [], total: count ?? 0 };
  } catch (err) {
    console.warn('[Supabase Dev Fallback] Fetch failed, loading from mock memory.');
    const activeLeads = mockLeadsStore.filter(l => !l.deleted_at);
    return { leads: activeLeads, total: activeLeads.length };
  }
}

/** Create a new lead. */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...input, status: input.status ?? 'new' })
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  } catch (err) {
    console.warn('[Supabase Dev Fallback] Insertion failed, generating local mock lead object.');
    
    const newLead: Lead = {
      id: `mock-lead-id-${Date.now()}`,
      full_name: input.full_name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      industry: input.industry ?? null,
      status: (input.status as LeadStatus) ?? 'new',
      source: input.source ?? null,
      assigned_to: input.assigned_to ?? null,
      value: input.value ?? null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockLeadsStore.push(newLead);
    return newLead;
  }
}

/** Single lead with notes, meetings, and followups. */
export async function getLeadById(id: string): Promise<LeadWithRelations> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*, notes(*), meetings(*), followups(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new Error('Lead not found');
    return data as LeadWithRelations;
  } catch (err) {
    const lead = mockLeadsStore.find(l => l.id === id && !l.deleted_at);
    if (!lead) throw Object.assign(new Error('Lead not found in memory'), { status: 404 });
    return { ...lead, notes: [], meetings: [], followups: [] };
  }
}

/** Partial update of lead fields. */
export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) throw new Error('Lead not found');
    return data as Lead;
  } catch (err) {
    const index = mockLeadsStore.findIndex(l => l.id === id && !l.deleted_at);
    if (index === -1) throw Object.assign(new Error('Lead not found in memory'), { status: 404 });
    
    mockLeadsStore[index] = {
      ...mockLeadsStore[index]!,
      ...input,
      status: (input.status as LeadStatus) ?? mockLeadsStore[index]!.status,
      updated_at: new Date().toISOString()
    };
    return mockLeadsStore[index]!;
  }
}

/** Soft delete — sets deleted_at timestamp. */
export async function deleteLead(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) throw new Error('Lead not found');
  } catch (err) {
    const index = mockLeadsStore.findIndex(l => l.id === id && !l.deleted_at);
    if (index === -1) throw Object.assign(new Error('Lead not found in memory'), { status: 404 });
    mockLeadsStore[index]!.deleted_at = new Date().toISOString();
  }
}

/** Update only the lead status. Returns updated lead and previous status. */
export async function updateLeadStatus(
  id: string,
  newStatus: LeadStatus
): Promise<{ lead: Lead; oldStatus: LeadStatus }> {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('leads')
      .select('status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !current) throw new Error('Lead not found');

    const oldStatus = current.status as LeadStatus;

    const { data, error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error('Status update failed');
    return { lead: data as Lead, oldStatus };
  } catch (err) {
    const index = mockLeadsStore.findIndex(l => l.id === id && !l.deleted_at);
    if (index === -1) throw Object.assign(new Error('Lead not found in memory'), { status: 404 });
    
    const oldStatus = mockLeadsStore[index]!.status;
    mockLeadsStore[index]!.status = newStatus;
    mockLeadsStore[index]!.updated_at = new Date().toISOString();
    
    return { lead: mockLeadsStore[index]!, oldStatus };
  }
}