import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import { enqueueAutomationJob } from './queues/automationJobs.queue';
import { WorkflowKey } from './workflowRegistry';

/** GET /api/automation/jobs — paginated list of automation jobs. */
export async function listAutomationJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagination = getPagination(req);

    let query = supabase
      .from('automation_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    // Optional filters
    const { status, workflow_key } = req.query;
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    if (workflow_key && typeof workflow_key === 'string') {
      query = query.eq('workflow_key', workflow_key);
    }

    const { data, error, count } = await query;

    if (error) {
      throw Object.assign(new Error(error.message), { status: 500 });
    }

    sendSuccess(res, data ?? [], 'Automation jobs fetched', 200, {
      page: pagination.page,
      limit: pagination.limit,
      total: count ?? 0,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/automation/jobs/:id — single automation job detail. */
export async function getAutomationJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !job) {
      sendError(res, 'Automation job not found', 404);
      return;
    }

    sendSuccess(res, job, 'Automation job retrieved');
  } catch (err) {
    next(err);
  }
}

/** POST /api/automation/jobs/:id/replay — re-enqueue a failed or dead_letter job. */
export async function replayAutomationJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !job) {
      sendError(res, 'Automation job not found', 404);
      return;
    }

    if (job.status !== 'failed' && job.status !== 'dead_letter') {
      sendError(res, `Cannot replay a job with status '${job.status}'. Only 'failed' or 'dead_letter' jobs can be replayed.`, 400);
      return;
    }

    // Create a brand new job with the same payload — fresh BullMQ job ID
    const { jobId } = await enqueueAutomationJob(
      job.workflow_key as WorkflowKey,
      job.payload,
      job.triggered_by_event ?? undefined
    );

    sendSuccess(res, { originalJobId: id, replayedJobId: jobId }, 'Automation job replayed', 201);
  } catch (err) {
    next(err);
  }
}
