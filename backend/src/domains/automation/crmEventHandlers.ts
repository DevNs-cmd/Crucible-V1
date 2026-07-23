import { eventBroker, CRMEvent } from './eventBroker';
import { enqueueAutomationJob } from './queues/automationJobs.queue';

/**
 * CRM Background Event Subscriptions
 * Registers listeners that decide which automation workflows to trigger.
 */
export function initCRMEventListeners() {
  console.log('[CRM Event System] 🔄 Initializing event channel subscriptions...');

  // 1. Listen for New Leads → enqueue n8n new-lead workflow
  eventBroker.subscribe('lead.created', async (event: CRMEvent) => {
    console.log(`[Event Worker] 🎯 Event Hook Triggered! -> ${event.type}`);
    try {
      const { jobId } = await enqueueAutomationJob('n8n.new_lead', event.payload, event.type);
      console.log(`[Event Worker] Enqueued automation job ${jobId} for lead.created`);
    } catch (err) {
      console.error('[Event Worker] Failed to enqueue new-lead automation job:', err);
    }
  });

  // 2. Listen for Lead Status Updates → enqueue n8n status-change workflow
  eventBroker.subscribe('lead.updated', async (event: CRMEvent) => {
    console.log(`[Event Worker] 🔄 Event Hook Triggered! -> ${event.type}`);
    try {
      const { jobId } = await enqueueAutomationJob('n8n.status_change', event.payload, event.type);
      console.log(`[Event Worker] Enqueued automation job ${jobId} for lead.updated`);
    } catch (err) {
      console.error('[Event Worker] Failed to enqueue status-change automation job:', err);
    }
  });

  // 3. Listen for Due Follow-ups → enqueue n8n follow-up reminder workflow
  eventBroker.subscribe('followup.due', async (event: CRMEvent) => {
    console.log(`[Event Worker] ⏰ Event Hook Triggered! -> ${event.type}`);
    try {
      const { jobId } = await enqueueAutomationJob('n8n.followup_reminder', event.payload, event.type);
      console.log(`[Event Worker] Enqueued automation job ${jobId} for followup.due`);
    } catch (err) {
      console.error('[Event Worker] Failed to enqueue followup-reminder automation job:', err);
    }
  });
}