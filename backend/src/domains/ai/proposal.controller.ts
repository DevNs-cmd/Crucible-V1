import { Request, Response, NextFunction } from 'express';
import { enqueueAIJob } from '../automation/queues/aiJobs.queue';
import { GenerateProposalSchema } from '../../utils/validators';
import { sendSuccess, sendError } from '../../utils/response';

/** POST /api/proposals/generate */
export async function generateProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = GenerateProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const { jobId } = await enqueueAIJob('proposal', parsed.data, req.user!.userId);
    sendSuccess(res, { jobId }, 'Proposal generation enqueued', 202);
  } catch (err) {
    next(err);
  }
}
