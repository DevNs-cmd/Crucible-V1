export type EntityType = 'lead' | 'note' | 'meeting' | 'followup' | 'user';
export type ActivityAction = 'create' | 'update' | 'delete' | 'status_change';

export interface ActivityLog {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  action: ActivityAction;
  actor_id: string | null;
  before_state: any | null;
  after_state: any | null;
  metadata: any | null;
  created_at: string;
}

export interface ActivityLogEntry {
  entity_type: EntityType;
  entity_id: string;
  action: ActivityAction;
  actor_id?: string | null;
  before_state?: any | null;
  after_state?: any | null;
  metadata?: any | null;
}
