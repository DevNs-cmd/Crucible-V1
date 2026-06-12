# AlgoForce AI — Backend

Production-ready Express + TypeScript backend for the AlgoForce AI CRM platform.
Covers B1 (CRM), B2 (AI Audit Generator), and B3 (n8n Automation).

---

## How to Run

### 1. Clone and install

```bash
cd backend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values. The app will **crash at startup** if any
required variable is missing or malformed (intentional fail-fast behaviour).

### 3. Set up the database

Open the Supabase SQL Editor and run the migrations in order:

```
database/migrations/001_initial_schema.sql
database/migrations/002_seed_admin_user.sql
```

For the seed file, replace the placeholder password hash with a real bcrypt hash:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YourPassword123', 10))"
```

### 4. Run in development

```bash
npm run dev
```

The server starts at `http://localhost:4000`.

### 5. Run tests

```bash
npm test              # All tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
```

### 6. Build for production

```bash
npm run build
npm start
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| POST | `/api/auth/logout` | ❌ | Stateless logout |
| GET | `/api/auth/me` | ✅ | Get current user |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | ✅ | Paginated list (filter: status, assigned_to) |
| POST | `/api/leads` | ✅ | Create lead (triggers n8n) |
| GET | `/api/leads/:id` | ✅ | Single lead with notes/meetings/followups |
| PUT | `/api/leads/:id` | ✅ | Update lead fields |
| DELETE | `/api/leads/:id` | ✅ | Soft delete |
| PATCH | `/api/leads/:id/status` | ✅ | Update status (triggers n8n) |

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
| POST | `/api/leads/:id/meetings` | ✅ | Log meeting |

### Follow-Ups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/:id/followups` | ✅ | List follow-ups |
| POST | `/api/leads/:id/followups` | ✅ | Create follow-up |
| PATCH | `/api/leads/:id/followups/:fid` | ✅ | Mark complete |

### AI Audit
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/audit/generate` | ✅ | Generate AI audit report |

### Webhooks (called by n8n)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhooks/email/new-lead` | ❌ | Send new lead email |
| POST | `/api/webhooks/email/status-change` | ❌ | Send status change email |
| POST | `/api/webhooks/email/followup-reminder` | ❌ | Send reminder email |

---

## Response Format

All endpoints return a consistent shape:

```json
// Success
{ "success": true, "data": {}, "message": "OK", "pagination": { "page": 1, "limit": 20, "total": 100 } }

// Error
{ "success": false, "error": "Validation failed", "details": { "email": ["Invalid email"] } }
```

---

## Architecture Notes

- **Services** own all business logic and Supabase queries
- **Controllers** are thin — parse input, call service, send response
- **Automation webhooks** are fire-and-forget — failures never break the API
- **Email service** has 2-retry logic on SMTP failure
- **Cron job** only runs when `NODE_ENV=production` or `ENABLE_CRON=true`
- **Env validation** crashes the process on startup if config is invalid

---

## n8n Workflow Setup

See `N8N_WORKFLOWS.md` for full workflow documentation, payload schemas, and
recommended node configurations for all three automation triggers.
