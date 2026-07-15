import { Worker } from 'bullmq';
import { supabase } from '../../../config/database';
import { generateAuditReport } from '../../ai/audit.service';
import { generateProposal } from '../../ai/proposal.service';
import { eventBroker } from '../eventBroker';
import { connectionOptions } from './aiJobs.queue';

async function updateJobStatus(jobId: string, status: string) {
  const { error } = await supabase
    .from('ai_jobs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error(`[Worker] Failed to update status to ${status} for job ${jobId}:`, error.message);
  }
}

async function updateJobSuccess(jobId: string, result: any) {
  const { error } = await supabase
    .from('ai_jobs')
    .update({
      status: 'completed',
      result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error(`[Worker] Failed to save success result for job ${jobId}:`, error.message);
  }
}

async function updateJobFailure(jobId: string, errMsg: string) {
  const { error } = await supabase
    .from('ai_jobs')
    .update({
      status: 'failed',
      error: errMsg,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error(`[Worker] Failed to save failure log for job ${jobId}:`, error.message);
  }
}

export const aiJobsWorker = new Worker(
  'ai-jobs',
  async (job) => {
    const { jobId, input, requestedBy } = job.data;
    console.log(`[Worker] Processing job ${job.id} (${job.name})...`);

    // Update status to processing
    await updateJobStatus(jobId, 'processing');

    if (job.name === 'audit') {
      const result = await generateAuditReport(input, requestedBy);
      await updateJobSuccess(jobId, result);
      
      // Publish completion event
      await eventBroker.publish('ai_job.completed', {
        jobId,
        jobType: 'audit',
        requestedBy,
        result,
      });
    } else if (job.name === 'proposal') {
      const result = await generateProposal(input, requestedBy);
      await updateJobSuccess(jobId, result);
      
      // Publish completion event
      await eventBroker.publish('ai_job.completed', {
        jobId,
        jobType: 'proposal',
        requestedBy,
        result,
      });
    }
  },
  {
    connection: connectionOptions,
  }
);

aiJobsWorker.on('failed', async (job, err) => {
  if (job) {
    const { jobId, requestedBy } = job.data;
    console.error(`[Worker] Job ${job.id} failed after maximum retry attempts:`, err.message);
    await updateJobFailure(jobId, err.message);
    // Publish failure event
    await eventBroker.publish('ai_job.failed', {
      jobId,
      jobType: job.name,
      requestedBy,
      error: err.message,
    });
  }
});
