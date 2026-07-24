-- Migration 010: Section 9 security hardening
-- Adds persisted hashed refresh tokens for rotation/replay detection and
-- widens activity_log so abuse/security events reuse the existing audit trail.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id          UUID,
  session_id               UUID NOT NULL,
  token_family_id          UUID NOT NULL,
  token_hash               TEXT NOT NULL UNIQUE,
  replaced_by_token_hash   TEXT,
  revoked_at               TIMESTAMPTZ,
  revocation_reason        TEXT,
  expires_at               TIMESTAMPTZ NOT NULL,
  ip_address               TEXT,
  user_agent               TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id
  ON refresh_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id
  ON refresh_tokens(token_family_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
  ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active_session
  ON refresh_tokens(session_id) WHERE revoked_at IS NULL;

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_entity_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_entity_type_check
  CHECK (entity_type IN ('lead', 'note', 'meeting', 'followup', 'user', 'automation', 'security'));

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_action_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_check
  CHECK (
    action IN (
      'create',
      'update',
      'delete',
      'status_change',
      'automation_trigger',
      'automation_complete',
      'automation_fail',
      'security_alert'
    )
  );
