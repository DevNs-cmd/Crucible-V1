import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

/** GET /api/jobs/:id */
export async function getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('ai_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !job) {
      sendError(res, 'Job not found', 404);
      return;
    }

    // Authorization check: only owner (requested_by === req.user.userId) or admin (role === 'admin')
    const isOwner = job.requested_by === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      sendError(res, 'Forbidden: You do not have permission to view this job', 403);
      return;
    }

    sendSuccess(res, job, 'Job status retrieved');
  } catch (err) {
    next(err);
  }
}
