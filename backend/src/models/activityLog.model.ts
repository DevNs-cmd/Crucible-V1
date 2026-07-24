export type EntityType = 'lead' | 'note' | 'meeting' | 'followup' | 'user' | 'automation' | 'security';
export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'automation_trigger'
  | 'automation_complete'
  | 'automation_fail'
  | 'security_alert';

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
