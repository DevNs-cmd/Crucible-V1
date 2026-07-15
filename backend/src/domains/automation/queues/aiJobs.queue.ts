import { Queue, ConnectionOptions } from 'bullmq';
import { randomUUID } from 'crypto';
import { supabase } from '../../../config/database';

export const connectionOptions: ConnectionOptions = process.env.REDIS_HOST
  ? {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    }
  : {
      host: '127.0.0.1',
      port: 6379,
    };

export const aiJobsQueue = new Queue('ai-jobs', {
  connection: connectionOptions,
});

/** Enqueue a new AI background job (audit or proposal) and track its state in DB. */
export async function enqueueAIJob(
  jobType: 'audit' | 'proposal',
  input: any,
  requestedBy: string
): Promise<{ jobId: string }> {
  const jobId = randomUUID();

  // 1. Insert initial job record in 'queued' status
  const { error } = await supabase.from('ai_jobs').insert({
    id: jobId,
    job_type: jobType,
    status: 'queued',
    input,
    requested_by: requestedBy,
  });

  if (error) {
    throw Object.assign(new Error(`Failed to initialize job state: ${error.message}`), { status: 500 });
  }

  // 2. Add job to BullMQ queue with attempts and exponential backoff
  await aiJobsQueue.add(
    jobType,
    { jobId, input, requestedBy },
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
