import { supabase } from '../../config/database';
import { ActivityLog, ActivityLogEntry, EntityType } from '../../models/activityLog.model';
import { PaginationParams } from '../../utils/pagination';

export interface ActivityLogFilters {
  entity_type?: EntityType;
  entity_id?: string;
}

/** Record a new activity entry in the activity_log table (best-effort, never throws). */
export async function recordActivity(entry: ActivityLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_log')
      .insert({
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        actor_id: entry.actor_id ?? null,
        before_state: entry.before_state ?? null,
        after_state: entry.after_state ?? null,
        metadata: entry.metadata ?? null,
      });

    if (error) {
      console.error('Failed to record activity log:', error.message);
    }
  } catch (err: any) {
    console.error('Failed to record activity log (exception):', err?.message || err);
  }
}

/** Get a paginated, filterable list of activity logs. */
export async function getActivityLogs(
  filters: ActivityLogFilters,
  pagination?: PaginationParams
): Promise<{ logs: ActivityLog[]; total: number }> {
  let query = supabase
    .from('activity_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (pagination) {
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  if (filters.entity_type) {
    query = query.eq('entity_type', filters.entity_type);
  }
  if (filters.entity_id) {
    query = query.eq('entity_id', filters.entity_id);
  }

  const { data, error, count } = await query;

  if (error) {
    throw Object.assign(new Error(error.message), { status: 500 });
  }

  return {
    logs: (data as ActivityLog[]) ?? [],
    total: count ?? 0,
  };
}
