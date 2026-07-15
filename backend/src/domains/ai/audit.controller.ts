import { Request, Response, NextFunction } from 'express';
import { enqueueAIJob } from '../automation/queues/aiJobs.queue';
import { GenerateAuditSchema } from '../../utils/validators';
import { sendSuccess, sendError } from '../../utils/response';

/** POST /api/audit/generate */
export async function generateAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = GenerateAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const { jobId } = await enqueueAIJob('audit', parsed.data, req.user!.userId);
    sendSuccess(res, { jobId }, 'Audit report generation enqueued', 202);
  } catch (err) {
    next(err);
  }
}
