import { eventBroker, CRMEvent } from '../utils/eventBroker';

/**
 * CRM Background Event Subscriptions
 * Registers listeners to handle side-effects asynchronously.
 */
export function initCRMEventListeners() {
  console.log('[CRM Event System] 🔄 Initializing event channel subscriptions...');

  // 1. Listen for New Leads
  eventBroker.subscribe('lead.created', (event: CRMEvent) => {
    console.log(`\n[Event Worker] 🎯 Event Hook Triggered! -> ${event.type}`);
    console.log(`[Event Worker] Payload processed for Lead ID: ${event.payload.leadId || 'Unknown'}`);
    console.log(`[Event Worker] Data Object:`, event.payload);
  });

  // 2. Listen for Lead Status Updates
  eventBroker.subscribe('lead.updated', (event: CRMEvent) => {
    console.log(`\n[Event Worker] 🔄 Event Hook Triggered! -> ${event.type}`);
    console.log(`[Event Worker] Updating records for Lead ID: ${event.payload.leadId}`);
    console.log(`[Event Worker] Shifted from ${event.payload.oldState} -> ${event.payload.newState}`);
  });

  // 3. Listen for Due Follow-ups
  eventBroker.subscribe('followup.due', (event: CRMEvent) => {
    console.log(`\n[Event Worker] ⏰ Event Hook Triggered! -> ${event.type}`);
    console.log(`[Event Worker] Scheduling automated notification task.`);
  });
}