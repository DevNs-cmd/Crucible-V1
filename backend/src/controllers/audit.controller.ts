import { Request, Response, NextFunction } from 'express';
import * as AuditService from '../services/audit.service';
import { GenerateAuditSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/** POST /api/audit/generate */
export async function generateAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = GenerateAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await AuditService.generateAuditReport(parsed.data, req.user!.userId);
    sendSuccess(res, result, 'Audit report generated');
  } catch (err) {
    next(err);
  }
}
