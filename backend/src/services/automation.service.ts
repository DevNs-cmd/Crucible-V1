import { env } from '../config/env';

/** Generic HTTP POST to an n8n webhook URL. Errors are swallowed — never breaks the main flow. */
async function triggerWebhook(url: string, body: Record<string, unknown>): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000), // 8-second timeout
    });

    if (!response.ok) {
      console.warn(
        `[AutomationService] Webhook ${url} responded with status ${response.status}`
      );
    }
  } catch (err) {
    // Log but never throw — automation failures must not break the API response
    console.error(`[AutomationService] Failed to trigger webhook ${url}:`, err);
  }
}

export interface NewLeadPayload {
  leadId: string;
  leadName: string;
  company: string;
  industry: string | null;
  assignedTo: string | null;
  assignedToEmail: string | null;
  createdAt: string;
}

/**
 * Trigger the n8n "new lead created" workflow.
 */
export async function triggerNewLeadWebhook(payload: NewLeadPayload): Promise<void> {
  await triggerWebhook(env.N8N_WEBHOOK_NEW_LEAD, payload as unknown as Record<string, unknown>);
}

export interface StatusChangePayload {
  leadId: string;
  leadName: string;
  company: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

/**
 * Trigger the n8n "lead status changed" workflow.
 */
export async function triggerStatusChangeWebhook(payload: StatusChangePayload): Promise<void> {
  await triggerWebhook(
    env.N8N_WEBHOOK_STATUS_CHANGE,
    payload as unknown as Record<string, unknown>
  );
}

export interface FollowUpReminderItem {
  id: string;
  leadName: string;
  company: string;
  dueAt: string;
  assignedToEmail: string;
  description: string;
}

/**
 * Trigger the n8n "follow-up reminder" workflow with a batch of overdue items.
 */
export async function triggerFollowUpReminderWebhook(
  followups: FollowUpReminderItem[]
): Promise<void> {
  if (followups.length === 0) return;
  await triggerWebhook(env.N8N_WEBHOOK_FOLLOWUP_REMINDER, { followups });
}
