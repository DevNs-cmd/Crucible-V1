/**
 * migrate.js — Run all DB migrations + seed against Supabase PostgreSQL
 * Usage: node scripts/migrate.js
 *
 * Requires DATABASE_URL in your .env file:
 *   DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
 */

require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const CONNECTION_STRING = process.env.DATABASE_URL;
if (!CONNECTION_STRING) {
  console.error('\n❌ DATABASE_URL is not set in your .env file.');
  console.error('  Add: DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres\n');
  process.exit(1);
}

// ─── SQL Migrations (in order) ────────────────────────────────────────────────

const MIGRATION_001_USERS = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at'
  ) THEN
    CREATE TRIGGER set_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
`;

const MIGRATION_002_LEADS = `
CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  industry    TEXT,
  status      TEXT NOT NULL DEFAULT 'new'
              CHECK (status IN ('new','contacted','proposal','negotiation','closed_won','closed_lost')),
  source      TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  value       NUMERIC,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_leads_updated_at'
  ) THEN
    CREATE TRIGGER set_leads_updated_at
      BEFORE UPDATE ON leads
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at  ON leads(deleted_at);
`;

const MIGRATION_003_NOTES_MEETINGS_FOLLOWUPS = `
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);

CREATE TABLE IF NOT EXISTS meetings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  met_at     TIMESTAMPTZ NOT NULL,
  outcome    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);

CREATE TABLE IF NOT EXISTS followups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_at       TIMESTAMPTZ NOT NULL,
  description  TEXT NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_due_at  ON followups(due_at) WHERE completed = false;
`;

const MIGRATION_004_LOGS = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  industry     TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  industry     TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const MIGRATION_005_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_audit_logs_requested_by   ON audit_logs(requested_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_generated_at   ON audit_logs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_name   ON audit_logs(company_name);
CREATE INDEX IF NOT EXISTS idx_proposal_logs_requested_by ON proposal_logs(requested_by);
CREATE INDEX IF NOT EXISTS idx_proposal_logs_generated_at ON proposal_logs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_logs_company_name ON proposal_logs(company_name);
`;

const MIGRATION_006_ACTIVITY_LOG = `
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
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
`;

const MIGRATION_007_AI_JOBS = `
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
`;

const MIGRATION_008_CONFIDENCE_CRITIC = `
ALTER TABLE ai_jobs ADD COLUMN IF NOT EXISTS confidence_score INTEGER;
ALTER TABLE ai_jobs ADD COLUMN IF NOT EXISTS critic_notes TEXT;
`;

// ─── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });

  try {
    console.log('\n🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Generate bcrypt hash for admin password
    const adminHash = bcrypt.hashSync('Admin@123', 10);

    const steps = [
      { name: '001 — users table',                    sql: MIGRATION_001_USERS },
      { name: '002 — leads table',                    sql: MIGRATION_002_LEADS },
      { name: '003 — notes, meetings, followups',     sql: MIGRATION_003_NOTES_MEETINGS_FOLLOWUPS },
      { name: '004 — audit_logs, proposal_logs',      sql: MIGRATION_004_LOGS },
      { name: '005 — log indexes',                    sql: MIGRATION_005_INDEXES },
      { name: '006 — activity_log table',             sql: MIGRATION_006_ACTIVITY_LOG },
      { name: '007 — ai_jobs table',                  sql: MIGRATION_007_AI_JOBS },
      { name: '008 — confidence and critic columns',  sql: MIGRATION_008_CONFIDENCE_CRITIC },
      {
        name: 'SEED — admin user (admin@algoforce.ai / Admin@123)',
        sql: `
          INSERT INTO users (email, password, full_name, role)
          VALUES ('admin@algoforce.ai', '${adminHash}', 'AlgoForce Admin', 'admin')
          ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
        `,
      },
    ];

    for (const step of steps) {
      process.stdout.write(`  Running ${step.name}... `);
      await client.query(step.sql);
      console.log('✅ Done');
    }

    // Verify tables
    console.log('\n📋 Verifying tables...');
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    const tables = rows.map(r => r.tablename);
    const expected = ['activity_log', 'ai_jobs', 'audit_logs', 'followups', 'leads', 'meetings', 'notes', 'proposal_logs', 'users'];
    expected.forEach(t => {
      console.log(`  ${tables.includes(t) ? '✅' : '❌'} ${t}`);
    });

    console.log('\n🎉 All migrations completed successfully!');
    console.log('─────────────────────────────────────────');
    console.log('  Login credentials:');
    console.log('  Email:    admin@algoforce.ai');
    console.log('  Password: Admin@123');
    console.log('─────────────────────────────────────────\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
