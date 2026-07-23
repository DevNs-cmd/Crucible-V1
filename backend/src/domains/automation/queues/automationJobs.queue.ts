import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { supabase } from '../../../config/database';
import { connectionOptions } from './aiJobs.queue';
import { WorkflowKey, getWorkflowVersion } from '../workflowRegistry';

export const automationJobsQueue = new Queue('automation-jobs', {
  connection: connectionOptions,
});

/** Enqueue a new automation job and track its state in DB. */
export async function enqueueAutomationJob(
  workflowKey: WorkflowKey,
  payload: Record<string, any>,
  triggeredByEvent?: string
): Promise<{ jobId: string }> {
  const jobId = randomUUID();
  const workflowVersion = getWorkflowVersion(workflowKey);

  // 1. Insert initial job record in 'queued' status
  const { error } = await supabase.from('automation_jobs').insert({
    id: jobId,
    workflow_key: workflowKey,
    workflow_version: workflowVersion,
    status: 'queued',
    payload,
    triggered_by_event: triggeredByEvent ?? null,
  });

  if (error) {
    throw Object.assign(new Error(`Failed to initialize automation job state: ${error.message}`), { status: 500 });
  }

  // 2. Add job to BullMQ queue with attempts and exponential backoff
  await automationJobsQueue.add(
    workflowKey,
    { jobId, workflowKey, workflowVersion, payload, triggeredByEvent },
    {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  );

  return { jobId };
}
