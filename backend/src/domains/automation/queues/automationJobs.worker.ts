import { Worker } from 'bullmq';
import { supabase } from '../../../config/database';
import { connectionOptions } from './aiJobs.queue';
import { WorkflowKey } from '../workflowRegistry';
import {
  triggerNewLeadWebhook,
  triggerStatusChangeWebhook,
  triggerFollowUpReminderWebhook,
} from '../automation.service';
import { recordActivity } from '../../activity-log/activityLog.service';

/** Update automation_jobs status and optional fields. */
async function updateAutomationJob(
  jobId: string,
  updates: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('automation_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error(`[AutomationWorker] Failed to update job ${jobId}:`, error.message);
  }
}

/** Route a workflow key to its corresponding n8n trigger function. */
async function executeWorkflow(workflowKey: WorkflowKey, payload: Record<string, any>): Promise<void> {
  switch (workflowKey) {
    case 'n8n.new_lead':
      await triggerNewLeadWebhook(payload as any);
      break;
    case 'n8n.status_change':
      await triggerStatusChangeWebhook(payload as any);
      break;
    case 'n8n.followup_reminder':
      await triggerFollowUpReminderWebhook(payload.followups ?? []);
      break;
    default:
      throw new Error(`Unknown workflow key: ${workflowKey}`);
  }
}

export const automationJobsWorker = new Worker(
  'automation-jobs',
  async (job) => {
    const { jobId, workflowKey, payload } = job.data;
    console.log(`[AutomationWorker] Processing job ${jobId} (${workflowKey}), attempt ${job.attemptsMade + 1}...`);

    // Update status to processing and increment attempt count
    await updateAutomationJob(jobId, {
      status: 'processing',
      attempt_count: job.attemptsMade + 1,
    });

    await executeWorkflow(workflowKey, payload);

    // Mark as completed
    await updateAutomationJob(jobId, { status: 'completed' });

    // Log success to activity log
    recordActivity({
      entity_type: 'automation',
      entity_id: jobId,
      action: 'automation_complete',
      metadata: { workflowKey, attempt: job.attemptsMade + 1 },
    });
  },
  {
    connection: connectionOptions,
  }
);

automationJobsWorker.on('failed', async (job, err) => {
  if (!job) return;

  const { jobId, workflowKey } = job.data;
  const isFinalAttempt = job.attemptsMade >= (job.opts?.attempts ?? 3);

  console.log(
    `[AutomationWorker] Job ${jobId} failed (attempt ${job.attemptsMade}/${job.opts?.attempts ?? 3}): ${err.message}`
  );

  if (isFinalAttempt) {
    // Dead letter — all retries exhausted
    await updateAutomationJob(jobId, {
      status: 'dead_letter',
      last_error: err.message,
    });

    recordActivity({
      entity_type: 'automation',
      entity_id: jobId,
      action: 'automation_fail',
      metadata: { workflowKey, error: err.message, finalAttempt: true },
    });
  } else {
    // Intermediate failure — will be retried by BullMQ
    await updateAutomationJob(jobId, {
      status: 'failed',
      last_error: err.message,
    });

    recordActivity({
      entity_type: 'automation',
      entity_id: jobId,
      action: 'automation_fail',
      metadata: { workflowKey, error: err.message, finalAttempt: false, attempt: job.attemptsMade },
    });
  }
});
