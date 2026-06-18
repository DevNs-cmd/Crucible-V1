import { Request, Response, NextFunction } from 'express';
import * as ProposalService from '../services/proposal.service';
import { GenerateProposalSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/** POST /api/proposals/generate */
export async function generateProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = GenerateProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await ProposalService.generateProposal(parsed.data, req.user!.userId);
    sendSuccess(res, result, 'Proposal generated');
  } catch (err) {
    next(err);
  }
}
