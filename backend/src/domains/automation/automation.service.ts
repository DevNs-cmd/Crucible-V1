import { env } from '../../config/env';

async function triggerWebhook(url: string, body: Record<string, unknown>): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`[AutomationService] Webhook ${url} returned status ${response.status}`);
    }
  } catch (err) {
    console.error(`[AutomationService] Failed to trigger webhook ${url}:`, err);
  }
}

export interface NewLeadPayload {
  leadId: string;
  leadName: string;
  company: string | null;
  industry: string | null;
  assignedTo: string | null;
  createdAt: string;
}

/** Trigger n8n new-lead workflow. */
export async function triggerNewLeadWebhook(payload: NewLeadPayload): Promise<void> {
  await triggerWebhook(env.N8N_WEBHOOK_NEW_LEAD, payload as unknown as Record<string, unknown>);
}

export interface StatusChangePayload {
  leadId: string;
  leadName: string;
  company: string | null;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

/** Trigger n8n status-change workflow. */
export async function triggerStatusChangeWebhook(payload: StatusChangePayload): Promise<void> {
  await triggerWebhook(env.N8N_WEBHOOK_STATUS_CHANGE, payload as unknown as Record<string, unknown>);
}

export interface FollowUpReminderItem {
  id: string;
  leadName: string;
  company: string;
  dueAt: string;
  assignedToEmail: string;
  description: string;
}

/** Trigger n8n follow-up reminder workflow. */
export async function triggerFollowUpReminderWebhook(
  followups: FollowUpReminderItem[]
): Promise<void> {
  if (followups.length === 0) return;
  await triggerWebhook(env.N8N_WEBHOOK_FOLLOWUP_REMINDER, { followups });
}
