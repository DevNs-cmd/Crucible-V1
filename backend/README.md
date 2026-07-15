# AlgoForce AI — Backend

Production-ready Express + TypeScript backend covering B1 (CRM), B2 (AI Audit + Proposals), B3 (n8n Automation), and B4 (Analytics).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
copy .env.example .env
# Open .env and fill in all values (see below)

# 3. Run database migrations in Supabase SQL Editor (in order):
#    database/migrations/001_users.sql
#    database/migrations/002_leads.sql
#    database/migrations/003_notes_meetings_followups.sql
#    database/migrations/004_audit_proposal_logs.sql
#    database/seeds/001_admin_user.sql  (after generating bcrypt hash)

# 4. Generate admin password hash
node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin@123',10))"
# Paste output into database/seeds/001_admin_user.sql, then run it

# 5. Start dev server
npm run dev

# 6. Run tests
npm test
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login → returns accessToken + refreshToken |
| POST | `/api/auth/refresh` | ❌ | Get new access token via refresh token |
| POST | `/api/auth/logout` | ❌ | Stateless logout |
| GET | `/api/auth/me` | ✅ | Get current user profile |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | ✅ | Paginated list (filter: status, assigned_to) |
| POST | `/api/leads` | ✅ | Create lead + trigger n8n webhook |
| GET | `/api/leads/:id` | ✅ | Single lead with notes, meetings, followups |
| PUT | `/api/leads/:id` | ✅ | Update lead fields |
| DELETE | `/api/leads/:id` | ✅ | Soft delete |
| PATCH | `/api/leads/:id/status` | ✅ | Update status + trigger n8n webhook |

### Notes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/:id/notes` | ✅ | List notes |
| POST | `/api/leads/:id/notes` | ✅ | Create note |
| DELETE | `/api/leads/:id/notes/:noteId` | ✅ | Delete note |

### Meetings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/:id/meetings` | ✅ | List meetings |
| POST | `/api/leads/:id/meetings` | ✅ | Log a meeting |

### Follow-Ups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/:id/followups` | ✅ | List follow-ups |
| POST | `/api/leads/:id/followups` | ✅ | Create follow-up |
| PATCH | `/api/leads/:id/followups/:fid` | ✅ | Mark as completed |

### AI Audit (B2 - Asynchronous)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/audit/generate` | ✅ | Enqueue AI business audit report job (returns 202 with jobId) |

### Proposals (B2 - Asynchronous)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/proposals/generate` | ✅ | Enqueue AI sales proposal job (returns 202 with jobId) |

### Background Jobs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/jobs/:id` | ✅ | Retrieve the status and results of an AI generation job (owner or admin only) |

### Analytics (B4)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/dashboard` | ✅ | Overall CRM stats |
| GET | `/api/analytics/leads-by-status` | ✅ | Lead count per status |
| GET | `/api/analytics/revenue` | ✅ | Monthly closed-won revenue (6 months) |
| GET | `/api/analytics/top-performers` | ✅ | Top users by closed deals |

### Webhooks (called by n8n)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhooks/email/new-lead` | ❌ | Trigger new lead email |
| POST | `/api/webhooks/email/status-change` | ❌ | Trigger status change email |
| POST | `/api/webhooks/email/followup-reminder` | ❌ | Trigger follow-up reminder email |

---

## Standard Response Format

```json
// Success
{ "success": true, "data": {}, "message": "OK", "pagination": { "page": 1, "limit": 20, "total": 100 } }

// Error
{ "success": false, "error": "Validation failed", "details": { "field": ["message"] } }
```

---

## Environment Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `SUPABASE_URL` | Project URL | supabase.com → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | supabase.com → Settings → API |
| `JWT_SECRET` | Random 32+ char string | Generate in PowerShell |
| `JWT_EXPIRES_IN` | Access token TTL | e.g. `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | e.g. `30d` |
| `GROQ_API_KEY` | Groq API key | console.groq.com (free) |
| `N8N_WEBHOOK_*` | n8n webhook URLs | n8n.io or use placeholders |
| `SMTP_HOST/PORT/USER/PASS` | Email config | Gmail + App Password |
| `SMTP_FROM` | Sender name/email | e.g. `"AlgoForce AI <you@gmail.com>"` |
| `ENABLE_CRON` | Enable cron in dev | `false` by default |

---

## Architecture

- **Services** — all business logic and Supabase queries
- **Controllers** — thin, only parse req/res and call services
- **Routes** — mount controllers, apply auth + rate limit middleware
- **Automation** — fire-and-forget, never crashes the API on webhook failure
- **Email** — 2-retry SMTP logic
- **Cron** — only runs when `NODE_ENV=production` or `ENABLE_CRON=true`
- **Env validation** — crashes at startup if any variable is missing/wrong
