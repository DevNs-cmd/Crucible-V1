# Migration order (canonical)

Run in this order against Supabase:

1. `001_users.sql`
2. `002_leads.sql`
3. `003_notes_meetings_followups.sql`
4. `004_audit_proposal_logs.sql`
5. `005_indexes_audit_proposal_logs.sql`
6. `006_audit_log.sql`
7. `007_ai_jobs.sql`

Admin seed: `../seeds/001_admin_user.sql` (run once, after `001_users.sql`).

## Archived — do not run

`_archive/001_initial_schema.sql.superseded` — an earlier monolith attempt that predates the
`audit_logs`/`proposal_logs` tables. Superseded by files 1–4 above. Kept only for history.

`_archive/002_seed_admin_user.sql.duplicate` — duplicate of `seeds/001_admin_user.sql`, same seed,
was numbered `002` which collided with `002_leads.sql`. Use `seeds/001_admin_user.sql` instead.

## Adding new migrations

Next number is **008**. Number sequentially, one concern per file, `CREATE ... IF NOT EXISTS`
everywhere so re-running a migration is a no-op rather than an error.
