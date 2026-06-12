# AlgoForce AI — n8n Workflow Documentation

## Overview

The backend triggers three outbound webhooks to n8n. n8n handles the downstream
logic (sending emails, Slack notifications, CRM updates, etc.).

The backend also exposes three **inbound** webhook endpoints that n8n can call to
trigger emails directly via the backend's email service.

---

## Trigger 1 — New Lead Created

**URL:** `N8N_WEBHOOK_NEW_LEAD` (your env var)  
**Method:** `POST`  
**Triggered by:** `POST /api/leads`

### Payload
```json
{
  "leadId": "uuid",
  "leadName": "Jane Doe",
  "company": "Acme Corp",
  "industry": "SaaS",
  "assignedTo": "user-uuid-or-null",
  "assignedToEmail": null,
  "createdAt": "2024-01-15T09:00:00.000Z"
}
```

### Recommended n8n Workflow
```
Webhook (Trigger)
  → HTTP Request: GET /api/leads/{{leadId}} (to enrich with full lead data)
  → IF: assigned_to != null
      → Send Email (via backend POST /api/webhooks/email/new-lead)
      → Slack: Post to #sales channel
  → Google Sheets: Append row to leads tracker
```

---

## Trigger 2 — Lead Status Changed

**URL:** `N8N_WEBHOOK_STATUS_CHANGE`  
**Method:** `POST`  
**Triggered by:** `PATCH /api/leads/:id/status`

### Payload
```json
{
  "leadId": "uuid",
  "leadName": "Jane Doe",
  "company": "Acme Corp",
  "oldStatus": "contacted",
  "newStatus": "proposal",
  "changedBy": "user-uuid",
  "changedAt": "2024-01-15T14:30:00.000Z"
}
```

### Recommended n8n Workflow
```
Webhook (Trigger)
  → Switch on newStatus:
      "closed_won"  → Send celebration Slack message + Email to team
      "closed_lost" → Send loss notification + Create follow-up task
      "proposal"    → Send proposal reminder email after 3 days (Wait node)
  → Airtable/Notion: Update CRM record
```

---

## Trigger 3 — Follow-Up Reminder (Daily Cron)

**URL:** `N8N_WEBHOOK_FOLLOWUP_REMINDER`  
**Method:** `POST`  
**Triggered by:** Backend cron job at 09:00 AM daily

### Payload
```json
{
  "followups": [
    {
      "id": "followup-uuid",
      "leadName": "Jane Doe",
      "company": "Acme Corp",
      "dueAt": "2024-01-15T00:00:00.000Z",
      "assignedToEmail": "sales@algoforce.ai",
      "description": "Call to discuss proposal"
    }
  ]
}
```

### Recommended n8n Workflow
```
Webhook (Trigger)
  → Split In Batches: group by assignedToEmail
  → For each user:
      → Send Email (via backend POST /api/webhooks/email/followup-reminder)
      → Optional: Create Slack DM with follow-up list
```

---

## Inbound Webhooks (n8n → Backend)

These endpoints allow n8n to call back into the backend to send emails.

| Endpoint | Description |
|---|---|
| `POST /api/webhooks/email/new-lead` | Send new lead assignment email |
| `POST /api/webhooks/email/status-change` | Send status change notification |
| `POST /api/webhooks/email/followup-reminder` | Send follow-up reminder email |

### Example: new-lead email body
```json
{
  "to": "sales@algoforce.ai",
  "leadName": "Jane Doe",
  "company": "Acme Corp"
}
```

---

## Security Note

The inbound webhook endpoints (`/api/webhooks/*`) are not JWT-protected by design
since n8n calls them server-to-server. For production, add an `x-webhook-secret`
header check:

```typescript
// In webhooks.routes.ts — add this middleware before controllers:
function verifyWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return sendError(res, 'Forbidden', 403);
  }
  next();
}
```

Then configure the same secret in your n8n HTTP Request nodes.
