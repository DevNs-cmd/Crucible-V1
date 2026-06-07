import { Request, Response, NextFunction } from 'express';
import * as MeetingsService from '../services/meetings.service';
import { CreateMeetingSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/leads/:id/meetings
 */
export async function getMeetings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const meetings = await MeetingsService.getMeetingsByLeadId(req.params['id']!);
    sendSuccess(res, meetings, 'Meetings fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/leads/:id/meetings
 */
export async function createMeeting(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = CreateMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    const meeting = await MeetingsService.createMeeting(
      req.params['id']!,
      req.user!.userId,
      parsed.data
    );
    sendSuccess(res, meeting, 'Meeting logged successfully', 201);
  } catch (err) {
    next(err);
  }
}
