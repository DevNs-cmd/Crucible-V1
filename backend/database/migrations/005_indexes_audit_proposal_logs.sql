-- Migration 005: indexes for audit_logs / proposal_logs (added in 004, had none)
-- Also adds compound indexes matching real dashboard/query access patterns.

-- audit_logs: activity feed and "who requested what" lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_requested_by   ON audit_logs(requested_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_generated_at   ON audit_logs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_name   ON audit_logs(company_name);

-- proposal_logs: same access pattern as audit_logs
CREATE INDEX IF NOT EXISTS idx_proposal_logs_requested_by ON proposal_logs(requested_by);
CREATE INDEX IF NOT EXISTS idx_proposal_logs_generated_at ON proposal_logs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_logs_company_name ON proposal_logs(company_name);

-- leads: dashboard/pipeline queries filter by assigned_to AND status together,
-- and the Kanban board sorts open (non-deleted) leads by recency.
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status
  ON leads(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON leads(created_at DESC) WHERE deleted_at IS NULL;

-- followups: dashboard "upcoming meetings/followups" widgets sort by due_at
-- for a given lead's assignee; this compound index avoids scanning all open followups.
CREATE INDEX IF NOT EXISTS idx_followups_lead_due
  ON followups(lead_id, due_at) WHERE completed = false;
