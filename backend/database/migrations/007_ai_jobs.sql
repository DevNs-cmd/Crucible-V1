-- Migration 007: ai_jobs table for tracking background AI generation tasks
CREATE TABLE IF NOT EXISTS ai_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type     TEXT NOT NULL CHECK (job_type IN ('audit', 'proposal')),
  status       TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input        JSONB NOT NULL,
  result       JSONB,
  error        TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
