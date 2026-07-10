-- Migration 006: activity_log table for system-wide audit logging
CREATE TABLE IF NOT EXISTS activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('lead', 'note', 'meeting', 'followup', 'user')),
  entity_id     UUID NOT NULL,
  action        TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
  actor_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  before_state  JSONB,
  after_state   JSONB,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on (entity_type, entity_id)
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Index on created_at
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
