import { Request, Response, NextFunction } from 'express';
import * as AuditService from '../services/audit.service';
import { GenerateAuditSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/**
 * POST /api/audit/generate
 * Generate a structured AI business audit report via Claude.
 */
export async function generateAudit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = GenerateAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    const { report, generatedAt } = await AuditService.generateAuditReport(
      parsed.data,
      req.user!.userId
    );

    sendSuccess(res, { report, generatedAt }, 'Audit report generated successfully');
  } catch (err) {
    next(err);
  }
}
