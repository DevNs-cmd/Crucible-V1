// backend/src/domains/automation/slaEngine.ts
import { mockExecutionStore, updateExecutionState } from './execution.service';

const SLA_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour threshold for example

export const runSlaWatchdog = () => {
  setInterval(async () => {
    const now = new Date().getTime();

    for (const intent of mockExecutionStore) {
      // Only monitor non-terminal states
      if (intent.state === 'PENDING' || intent.state === 'IN_PROGRESS') {
        const lastUpdated = new Date(intent.updated_at).getTime();
        
        // If the task has exceeded the threshold, escalate it
        if (now - lastUpdated > SLA_THRESHOLD_MS) {
          console.log(`[SLA Engine] SLA Breach detected for ${intent.id}. Escalating...`);
          try {
            await updateExecutionState(intent.id, 'ESCALATED', 'SLA breach: Task took too long.');
          } catch (error) {
            console.error(`[SLA Engine] Failed to escalate ${intent.id}:`, error);
          }
        }
      }
    }
  }, 30000); // Check every 30 seconds
};