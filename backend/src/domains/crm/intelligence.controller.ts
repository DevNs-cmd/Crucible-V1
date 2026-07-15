import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import * as IntelligenceService from './intelligence.service';

/** GET /api/crm/intelligence/:leadId/score */
export async function getDealScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await IntelligenceService.getDealScore(req.params['leadId']!);
    sendSuccess(res, result, 'Deal score generated');
  } catch (err) {
    next(err);
  }
}

/** GET /api/crm/intelligence/:leadId/action */
export async function getNextBestAction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await IntelligenceService.getNextBestAction(req.params['leadId']!);
    sendSuccess(res, result, 'Next best action generated');
  } catch (err) {
    next(err);
  }
}

/** GET /api/crm/intelligence/:leadId/sla */
export async function getSlaStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await IntelligenceService.getSlaStatus(req.params['leadId']!);
    sendSuccess(res, result, 'CRM SLA status generated');
  } catch (err) {
    next(err);
  }
}

/** GET /api/crm/intelligence/:leadId/escalation */
export async function getEscalation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await IntelligenceService.getEscalation(req.params['leadId']!);
    sendSuccess(res, result, 'Escalation recommendation generated');
  } catch (err) {
    next(err);
  }
}

/** GET /api/crm/intelligence/revenue-leaks */
export async function getRevenueLeaks(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await IntelligenceService.getRevenueLeaks();
    sendSuccess(res, result, 'Revenue leaks detected');
  } catch (err) {
    next(err);
  }
}
