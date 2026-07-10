import { Request, Response, NextFunction } from 'express';
import * as FollowUpsService from '../services/followups.service';
import { CreateFollowUpSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/** GET /api/leads/:id/followups */
export async function getFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followups = await FollowUpsService.getFollowUpsByLeadId(req.params['id']!);
    sendSuccess(res, followups, 'Follow-ups fetched');
  } catch (err) { next(err); }
}

/** POST /api/leads/:id/followups */
export async function createFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateFollowUpSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const followup = await FollowUpsService.createFollowUp(req.params['id']!, req.user!.userId, parsed.data);
    sendSuccess(res, followup, 'Follow-up created', 201);
  } catch (err) { next(err); }
}

/** PATCH /api/leads/:id/followups/:fid */
export async function completeFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followup = await FollowUpsService.completeFollowUp(req.params['id']!, req.params['fid']!, req.user!.userId);
    sendSuccess(res, followup, 'Follow-up completed');
  } catch (err) { next(err); }
}
