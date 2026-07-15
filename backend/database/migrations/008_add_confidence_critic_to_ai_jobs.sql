-- Migration 008: Add confidence_score and critic_notes to ai_jobs
ALTER TABLE ai_jobs ADD COLUMN IF NOT EXISTS confidence_score INTEGER;
ALTER TABLE ai_jobs ADD COLUMN IF NOT EXISTS critic_notes TEXT;
