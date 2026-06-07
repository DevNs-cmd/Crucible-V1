# AlgoForce AI — Internal CRM & AI Automation Platform

> **Week 1 Sprint** · Internal CRM, AI tools & automation infrastructure  
> Team: Frontend (F1–F4) + Backend & AI (B1–B4)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [File Structure](#file-structure)
5. [Module Breakdown](#module-breakdown)
   - [Frontend Modules](#frontend-modules)
   - [Backend Modules](#backend-modules)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [AI Audit Generator](#ai-audit-generator)
9. [Automation System (n8n)](#automation-system-n8n)
10. [Environment Variables](#environment-variables)
11. [Installation & Setup](#installation--setup)
12. [Running the Project](#running-the-project)
13. [Workflow & Data Flow](#workflow--data-flow)
14. [Sprint Timeline](#sprint-timeline)
15. [Testing](#testing)
16. [Deployment](#deployment)
17. [Contributing](#contributing)

---

## Project Overview

AlgoForce AI is a full-stack internal CRM platform built for managing leads, generating AI-powered business audit reports, and automating repetitive sales workflows. Built in a single week sprint, the platform consists of:

- **Internal Dashboard UI** — 5-page responsive web application
- **Lead Management System** — complete CRM with status pipeline tracking
- **AI Audit Report Generator** — LLM-powered business audit API
- **Automation Engine** — n8n-based email and follow-up automation
- **Admin Analytics Dashboard** — real-time KPI tracking

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Browser / Mobile)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│              FRONTEND  (React / Next.js + Tailwind)          │
│  F1: Dashboard  │  F2: Lead Mgmt  │  F3: Proposals  │  F4: Mobile │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (JSON)
┌───────────────────────────▼─────────────────────────────────┐
│              BACKEND  (Node.js / Express)                     │
│  B1: CRM API   │  B2: AI Audit API  │  B3: Automation  │  B4: Analytics │
│            JWT Auth Middleware (all routes protected)         │
└────────┬──────────────────┬─────────────────┬───────────────┘
         │                  │                 │
┌────────▼──────┐  ┌────────▼──────┐  ┌───────▼──────────────┐
│  Supabase DB  │  │  Claude API   │  │  n8n + Firebase       │
│  (PostgreSQL) │  │  (LLM calls)  │  │  (automation + email) │
└───────────────┘  └───────────────┘  └──────────────────────┘
         │
         │ Supabase Realtime (WebSocket push)
         └──────────────────────────────────► Frontend live updates
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Next.js | UI framework, SSR |
| Styling | Tailwind CSS | Utility-first styling |
| Backend | Node.js + Express | API server |
| Database | Supabase (PostgreSQL) | Primary data store |
| Auth | JWT (JSON Web Tokens) | Stateless authentication |
| AI | Claude API / OpenAI | Audit report generation |
| Automation | n8n (self-hosted) | Workflow automation |
| Realtime | Supabase Realtime | Live data push |
| Notifications | Firebase / SMTP | Email delivery |
| Deployment | Vercel (FE) + Railway (BE) | Hosting |

---

## File Structure

```
algoforce-ai/
│
├── README.md
├── .env.example
├── .gitignore
│
├── frontend/                          # Next.js application
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   ├── public/
│   │   ├── logo.svg
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx             # Root layout (navbar, providers)
│   │   │   ├── page.tsx               # Landing / redirect to dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # F1: Login page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # F1: Main dashboard
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx           # F2: Lead list page
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx       # F2: Single lead detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx       # F2: Add new lead
│   │   │   ├── proposals/
│   │   │   │   └── page.tsx           # F3: Proposal generator
│   │   │   ├── projects/
│   │   │   │   └── page.tsx           # F1: Projects page
│   │   │   ├── reports/
│   │   │   │   └── page.tsx           # F1: Client reports
│   │   │   └── analytics/
│   │   │       └── page.tsx           # B4: Admin analytics view
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Table.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx         # F4: Responsive navbar
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MobileMenu.tsx     # F4: Mobile hamburger menu
│   │   │   ├── leads/
│   │   │   │   ├── LeadCard.tsx
│   │   │   │   ├── LeadForm.tsx       # F2: Add/edit lead form
│   │   │   │   ├── LeadStatus.tsx     # F2: Status badge + dropdown
│   │   │   │   ├── LeadNotes.tsx      # F2: Notes panel
│   │   │   │   ├── MeetingTracker.tsx # F2: Meeting log
│   │   │   │   └── FollowUpTracker.tsx# F2: Follow-up scheduler
│   │   │   ├── proposals/
│   │   │   │   ├── ProposalForm.tsx   # F3: Input form
│   │   │   │   └── ProposalPreview.tsx# F3: Formatted output
│   │   │   └── analytics/
│   │   │       ├── StatCard.tsx       # B4: KPI metric card
│   │   │       ├── LeadChart.tsx      # B4: Lead trend chart
│   │   │       └── ConversionFunnel.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLeads.ts            # Fetch + mutate leads
│   │   │   ├── useAuth.ts             # Auth state + JWT
│   │   │   ├── useAnalytics.ts        # Analytics data fetching
│   │   │   └── useRealtime.ts         # Supabase realtime subscription
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios instance + interceptors
│   │   │   ├── supabase.ts            # Supabase client
│   │   │   └── utils.ts               # Formatters, helpers
│   │   │
│   │   ├── types/
│   │   │   ├── lead.ts
│   │   │   ├── user.ts
│   │   │   ├── proposal.ts
│   │   │   └── analytics.ts
│   │   │
│   │   └── store/
│   │       ├── authStore.ts           # Zustand auth state
│   │       └── leadsStore.ts          # Zustand leads state
│   │
│   └── tests/
│       ├── components/
│       └── pages/
│
├── backend/                           # Node.js + Express API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   │
│   ├── src/
│   │   ├── server.ts                  # Entry point — Express app setup
│   │   ├── app.ts                     # App config, middleware registration
│   │   │
│   │   ├── config/
│   │   │   ├── database.ts            # Supabase client config
│   │   │   ├── ai.ts                  # Claude/OpenAI client config
│   │   │   └── env.ts                 # Env validation (zod)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT verify middleware
│   │   │   ├── errorHandler.ts        # Global error handler
│   │   │   ├── rateLimiter.ts         # Rate limiting (express-rate-limit)
│   │   │   ├── cors.ts                # CORS config
│   │   │   └── logger.ts              # Morgan request logger
│   │   │
│   │   ├── routes/                    # Route definitions
│   │   │   ├── index.ts               # Router aggregator
│   │   │   ├── auth.routes.ts         # POST /auth/login, /auth/logout
│   │   │   ├── leads.routes.ts        # CRUD /leads
│   │   │   ├── notes.routes.ts        # /leads/:id/notes
│   │   │   ├── meetings.routes.ts     # /leads/:id/meetings
│   │   │   ├── followups.routes.ts    # /leads/:id/followups
│   │   │   ├── audit.routes.ts        # POST /audit/generate
│   │   │   ├── proposals.routes.ts    # POST /proposals/generate
│   │   │   ├── analytics.routes.ts    # GET /analytics/*
│   │   │   └── webhooks.routes.ts     # POST /webhooks/n8n
│   │   │
│   │   ├── controllers/               # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── notes.controller.ts
│   │   │   ├── meetings.controller.ts
│   │   │   ├── followups.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── proposals.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── webhooks.controller.ts
│   │   │
│   │   ├── services/                  # Business logic
│   │   │   ├── auth.service.ts        # JWT sign/verify, bcrypt
│   │   │   ├── leads.service.ts       # Lead CRUD operations
│   │   │   ├── notes.service.ts
│   │   │   ├── meetings.service.ts
│   │   │   ├── followups.service.ts
│   │   │   ├── audit.service.ts       # LLM prompt + call
│   │   │   ├── proposals.service.ts   # Template engine
│   │   │   ├── analytics.service.ts   # Aggregation queries
│   │   │   ├── email.service.ts       # SMTP / Firebase email
│   │   │   └── automation.service.ts  # n8n trigger calls
│   │   │
│   │   ├── models/                    # TypeScript interfaces
│   │   │   ├── user.model.ts
│   │   │   ├── lead.model.ts
│   │   │   ├── note.model.ts
│   │   │   ├── meeting.model.ts
│   │   │   └── followup.model.ts
│   │   │
│   │   ├── prompts/                   # LLM prompt templates
│   │   │   ├── audit.prompt.ts        # B2: AI audit system prompt
│   │   │   └── proposal.prompt.ts     # F3: Proposal generation prompt
│   │   │
│   │   └── utils/
│   │       ├── response.ts            # Standard API response helpers
│   │       ├── validators.ts          # Zod input validation schemas
│   │       └── pagination.ts          # Cursor-based pagination helper
│   │
│   └── tests/
│       ├── unit/
│       │   ├── auth.test.ts
│       │   ├── leads.test.ts
│       │   └── audit.test.ts
│       └── integration/
│           ├── api.test.ts
│           └── automation.test.ts
│
├── database/                          # DB migrations & seeds
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_leads.sql
│   │   ├── 003_create_notes.sql
│   │   ├── 004_create_meetings.sql
│   │   └── 005_create_followups.sql
│   └── seeds/
│       └── seed_demo_data.sql
│
├── automation/                        # n8n workflow exports
│   ├── workflows/
│   │   ├── new_lead_email.json        # Trigger: new lead → email
│   │   ├── followup_reminder.json     # Trigger: follow-up due
│   │   └── status_change_notify.json  # Trigger: status changed
│   └── README.md
│
└── docs/
    ├── api-spec.yaml                  # OpenAPI 3.0 spec
    ├── architecture.md
    └── deployment.md
```

---

## Module Breakdown

### Frontend Modules

#### F1 — Internal Dashboard UI
The primary 5-page application shell.

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Auth form, JWT token storage |
| Dashboard | `/dashboard` | Summary stats, recent leads, quick actions |
| Projects | `/projects` | Project cards and status |
| Client Reports | `/reports` | Generate and view client-facing reports |
| Leads Overview | `/leads` | Lead pipeline table |

#### F2 — Lead Management UI
Full CRM interface for managing prospects.

| Component | Feature |
|-----------|---------|
| `LeadForm` | Add/edit lead with validation |
| `LeadStatus` | Drag-or-select pipeline status (New → Contacted → Proposal → Closed) |
| `LeadNotes` | Rich text notes attached to each lead |
| `MeetingTracker` | Log meetings with date, outcome, attendees |
| `FollowUpTracker` | Schedule follow-ups with reminder system |

#### F3 — Proposal Generator UI
AI-powered proposal creation tool.

```
Input form:
  - Company name (text)
  - Industry (select)
  - Services required (multi-select)
  - Problems to solve (textarea)
  - Budget range (select)

→ POST /api/proposals/generate

Output:
  - Formatted proposal document
  - Editable sections
  - PDF export button
```

#### F4 — Mobile Responsive Fixes
Ensures all pages work on screens 320px–1440px.

- Collapsible sidebar → hamburger menu on mobile
- Touch-friendly CTA buttons (min 44px tap targets)
- Responsive data tables → card layout on mobile
- Mobile-first navbar with smooth drawer animation

---

### Backend Modules

#### B1 — CRM Backend

**Authentication** (`/api/auth`)

```
POST   /api/auth/login          → { token, user }
POST   /api/auth/logout         → 200 OK
POST   /api/auth/refresh        → { token }
GET    /api/auth/me             → { user }
```

**Leads API** (`/api/leads`) — all routes JWT-protected

```
GET    /api/leads               → paginated lead list
POST   /api/leads               → create lead
GET    /api/leads/:id           → single lead with relations
PUT    /api/leads/:id           → update lead
DELETE /api/leads/:id           → soft delete
PATCH  /api/leads/:id/status    → update pipeline status
```

**Notes API** (`/api/leads/:id/notes`)
```
GET    /api/leads/:id/notes     → all notes for lead
POST   /api/leads/:id/notes     → add note
DELETE /api/leads/:id/notes/:nid→ remove note
```

**Meetings API** (`/api/leads/:id/meetings`)
```
GET    /api/leads/:id/meetings  → meeting history
POST   /api/leads/:id/meetings  → log meeting
```

**Follow-ups API** (`/api/leads/:id/followups`)
```
GET    /api/leads/:id/followups → scheduled follow-ups
POST   /api/leads/:id/followups → create follow-up
PATCH  /api/leads/:id/followups/:fid → mark complete
```

#### B2 — AI Audit Generator API

**Endpoint:**
```
POST /api/audit/generate
Authorization: Bearer <token>

Body:
{
  "industry": "E-commerce",
  "companyType": "B2C Startup",
  "companySize": "11-50",
  "problems": [
    "Low conversion rate",
    "Poor customer retention",
    "Manual order processing"
  ],
  "currentTools": ["Shopify", "Mailchimp"],
  "budget": "medium"
}

Response:
{
  "success": true,
  "report": {
    "executiveSummary": "...",
    "painPoints": [...],
    "recommendations": [...],
    "aiOpportunities": [...],
    "estimatedROI": "...",
    "implementationRoadmap": [...]
  },
  "generatedAt": "2026-06-07T08:00:00Z"
}
```

#### B3 — Automation System

Three core n8n workflows:

| Workflow | Trigger | Actions |
|----------|---------|---------|
| New lead email | `POST /webhooks/n8n/new-lead` | Send welcome email to team + log to Supabase |
| Follow-up reminder | Cron: daily 9am | Query overdue follow-ups → send email reminders |
| Status change notify | `POST /webhooks/n8n/status-change` | Notify assigned team member via email |

**Triggering automation from backend:**
```typescript
// automation.service.ts
await axios.post(process.env.N8N_WEBHOOK_NEW_LEAD, {
  leadId,
  leadName,
  company,
  assignedTo,
  createdAt
});
```

#### B4 — Admin Analytics

```
GET /api/analytics/leads/count        → { total, thisWeek, thisMonth }
GET /api/analytics/meetings           → { total, upcoming, pastWeek }
GET /api/analytics/conversion         → { rate, leadsTotal, converted }
GET /api/analytics/weekly             → { weekStart, weekEnd, metrics: {...} }
GET /api/analytics/pipeline           → { byStatus: { new, contacted, ... } }
```

---

## Database Schema

### `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- bcrypt hash
  full_name   TEXT NOT NULL,
  role        TEXT DEFAULT 'member',  -- 'admin' | 'member'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `leads`
```sql
CREATE TABLE leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  company      TEXT,
  industry     TEXT,
  status       TEXT DEFAULT 'new',   -- 'new' | 'contacted' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  source       TEXT,                  -- 'website' | 'referral' | 'outbound' | ...
  assigned_to  UUID REFERENCES users(id),
  value        NUMERIC,               -- estimated deal value
  deleted_at   TIMESTAMPTZ,           -- soft delete
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `notes`
```sql
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `meetings`
```sql
CREATE TABLE meetings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  title       TEXT NOT NULL,
  met_at      TIMESTAMPTZ NOT NULL,
  outcome     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `followups`
```sql
CREATE TABLE followups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id),
  due_at       TIMESTAMPTZ NOT NULL,
  description  TEXT,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI Audit Generator

The core of the B2 module. Uses prompt engineering to generate consistent, structured audit reports.

### System Prompt (simplified)

```typescript
// src/prompts/audit.prompt.ts

export const AUDIT_SYSTEM_PROMPT = `
You are an expert AI business consultant who specialises in digital transformation 
and AI adoption strategies. When given information about a company, you produce 
a structured Business AI Audit Report in JSON format only.

Your report must always contain these fields:
- executiveSummary (string, 2-3 sentences)
- painPoints (array of { title, description, severity: 'high'|'medium'|'low' })
- recommendations (array of { title, description, priority, estimatedImpact })
- aiOpportunities (array of { area, solution, tools, difficulty: 'easy'|'medium'|'hard' })
- estimatedROI (string, qualitative estimate)
- implementationRoadmap (array of { phase, duration, tasks[] })

Respond ONLY with valid JSON. No preamble, no explanation outside the JSON.
`;
```

### API Call Flow

```
1. Client sends POST /api/audit/generate with company data
2. Auth middleware validates JWT
3. audit.controller.ts calls audit.service.ts
4. audit.service.ts:
   a. Validates input with Zod schema
   b. Builds user prompt from input data
   c. Calls Claude API with system prompt + user prompt
   d. Parses JSON from LLM response
   e. Saves report to Supabase (optional)
   f. Returns structured report to client
```

---

## Automation System (n8n)

### Setup

n8n runs self-hosted (Docker) or on n8n Cloud. Import workflow JSON files from `automation/workflows/`.

### Workflow: New Lead Email

```
Trigger: Webhook (POST /webhook/new-lead)
   ↓
Set node: Extract leadName, company, assignedTo from body
   ↓
Email node: Send "New lead assigned" email to assignedTo
   ↓
Supabase node: Log automation event to audit_log table
```

### Workflow: Daily Follow-up Reminders

```
Trigger: Cron (9:00 AM daily)
   ↓
Supabase node: SELECT * FROM followups WHERE due_at <= NOW() AND completed = false
   ↓
IF node: results.length > 0?
   ↓ YES
Loop over items:
   ↓
Email node: "You have a follow-up due with {lead_name}"
```

### Adding a New Workflow

1. Design workflow in n8n UI
2. Export as JSON
3. Save to `automation/workflows/your-workflow.json`
4. Add corresponding webhook route in `backend/src/routes/webhooks.routes.ts`
5. Call webhook from relevant backend service

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# AI
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
AI_MODEL=claude-sonnet-4-20250514

# n8n Webhooks
N8N_WEBHOOK_NEW_LEAD=https://your-n8n.com/webhook/new-lead
N8N_WEBHOOK_STATUS_CHANGE=https://your-n8n.com/webhook/status-change

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=AlgoForce AI <noreply@algoforce.ai>

# Firebase (optional, for realtime notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Installation & Setup

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Supabase account (free tier works)
- Claude API key (Anthropic) or OpenAI API key
- n8n instance (Docker or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/algoforce/algoforce-ai.git
cd algoforce-ai
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set up environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Fill in all values in both files
```

### 4. Set up the database

```bash
# Run migrations in Supabase SQL editor (in order):
database/migrations/001_create_users.sql
database/migrations/002_create_leads.sql
database/migrations/003_create_notes.sql
database/migrations/004_create_meetings.sql
database/migrations/005_create_followups.sql

# Optional: seed with demo data
database/seeds/seed_demo_data.sql
```

### 5. Import n8n workflows

1. Open your n8n instance
2. Go to Workflows → Import from File
3. Import each JSON from `automation/workflows/`
4. Activate all workflows

---

## Running the Project

### Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev          # starts on http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm run dev          # starts on http://localhost:3000
```

### Production build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Using Docker (optional)

```bash
docker-compose up --build
```

---

## Workflow & Data Flow

### Lead creation flow (end-to-end)

```
1. User fills LeadForm on /leads/new (F2)
2. Frontend POSTs to /api/leads with JWT header
3. auth middleware validates token
4. leads.controller calls leads.service.createLead()
5. leads.service inserts into Supabase leads table
6. On success, automation.service calls n8n webhook
7. n8n sends "New lead" email to assigned user
8. Supabase Realtime pushes update to all connected clients
9. Frontend lead list updates live without page refresh
10. Response 201 returned to client with new lead object
```

### AI Audit flow (end-to-end)

```
1. User fills AuditForm (industry, problems, etc.)
2. Frontend POSTs to /api/audit/generate
3. audit.controller validates input (Zod)
4. audit.service builds prompt:
   system: AUDIT_SYSTEM_PROMPT
   user: "Company: {name}. Industry: {industry}. Problems: {problems}..."
5. Claude API called with max_tokens: 2000
6. Response parsed as JSON
7. Report returned to frontend
8. ProposalPreview renders formatted report
9. User can export as PDF
```

---

## Sprint Timeline

| Day | Module | Tasks |
|-----|--------|-------|
| 1 | B1 | DB schema design, Supabase setup, auth endpoints |
| 2 | B1 | Lead CRUD API, notes API, meetings API, follow-ups API |
| 3 | B2 | AI prompt engineering, Claude API integration, audit endpoint |
| 4 | B2 | Proposal generator, PDF export, error handling |
| 5 | B3 | n8n setup, email automation, follow-up reminders, CRM triggers |
| 6 | B4 | Analytics queries, KPI endpoints, admin dashboard data |
| 7 | ALL | Frontend↔Backend integration, E2E testing, bug fixes, deployment |

---

## Testing

### Run unit tests

```bash
cd backend
npm test                    # all tests
npm test -- --watch         # watch mode
npm test -- auth.test.ts    # single file
```

### Run integration tests

```bash
npm run test:integration
```

### Test API manually (curl examples)

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Get leads (replace TOKEN)
curl http://localhost:4000/api/leads \
  -H "Authorization: Bearer TOKEN"

# Generate audit
curl -X POST http://localhost:4000/api/audit/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "E-commerce",
    "companyType": "B2C Startup",
    "problems": ["Low conversion", "Manual processes"]
  }'
```

---

## Deployment

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up
```

Add all environment variables in Railway dashboard under Variables.

### Frontend → Vercel

```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard under Project Settings → Environment Variables.

### n8n → Self-hosted (Docker)

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## Contributing

### Branch naming

```
feature/b1-lead-crud-api
feature/b2-ai-audit-generator
fix/auth-token-expiry
chore/update-dependencies
```

### Commit message format

```
feat(B2): add AI audit generator endpoint
fix(B1): resolve JWT expiry race condition
docs: update API reference for analytics routes
chore: upgrade Supabase client to v2.x
```

### Pull request checklist

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Environment variables documented in `.env.example`
- [ ] API changes reflected in `docs/api-spec.yaml`
- [ ] PR description explains what changed and why

---

## Project Links

| Resource | URL |
|----------|-----|
| Frontend (dev) | http://localhost:3000 |
| Backend API (dev) | http://localhost:4000/api |
| n8n Dashboard | http://localhost:5678 |
| Supabase Dashboard | https://supabase.com/dashboard |
| API Docs (OpenAPI) | http://localhost:4000/api/docs |

---

*AlgoForce AI — Dev Team · Week 1 Sprint · Built with Node.js, React, Supabase, Claude API & n8n*#   C r u c i b l e - V 1  
 