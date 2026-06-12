import { Request, Response, NextFunction } from 'express';
import * as EmailService from '../services/email.service';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const NewLeadEmailSchema = z.object({
  to: z.string().email(),
  leadName: z.string().min(1),
  company: z.string().min(1),
});

const StatusChangeEmailSchema = z.object({
  to: z.string().email(),
  leadName: z.string().min(1),
  oldStatus: z.string().min(1),
  newStatus: z.string().min(1),
});

const FollowUpReminderEmailSchema = z.object({
  to: z.string().email(),
  followups: z.array(
    z.object({
      leadName: z.string(),
      company: z.string(),
      dueAt: z.string(),
      description: z.string(),
    })
  ),
});

/**
 * POST /api/webhooks/email/new-lead
 * Called by n8n to trigger a new lead notification email.
 */
export async function handleNewLeadEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = NewLeadEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    await EmailService.sendNewLeadEmail(parsed.data.to, parsed.data.leadName, parsed.data.company);
    sendSuccess(res, null, 'New lead email sent');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/webhooks/email/status-change
 * Called by n8n to trigger a status change notification email.
 */
export async function handleStatusChangeEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = StatusChangeEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    await EmailService.sendStatusChangeEmail(
      parsed.data.to,
      parsed.data.leadName,
      parsed.data.oldStatus,
      parsed.data.newStatus
    );
    sendSuccess(res, null, 'Status change email sent');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/webhooks/email/followup-reminder
 * Called by n8n to trigger follow-up reminder emails.
 */
export async function handleFollowUpReminderEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = FollowUpReminderEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    await EmailService.sendFollowUpReminderEmail(parsed.data.to, parsed.data.followups);
    sendSuccess(res, null, 'Follow-up reminder email sent');
  } catch (err) {
    next(err);
  }
}
