import { Request, Response, NextFunction } from 'express';
import * as AnalyticsService from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

/** GET /api/analytics/dashboard */
export async function getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await AnalyticsService.getDashboardStats();
    sendSuccess(res, stats, 'Dashboard stats fetched');
  } catch (err) { next(err); }
}

/** GET /api/analytics/leads-by-status */
export async function getLeadsByStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await AnalyticsService.getLeadsByStatus();
    sendSuccess(res, data, 'Leads by status fetched');
  } catch (err) { next(err); }
}

/** GET /api/analytics/revenue */
export async function getRevenue(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await AnalyticsService.getRevenueByMonth();
    sendSuccess(res, data, 'Revenue data fetched');
  } catch (err) { next(err); }
}

/** GET /api/analytics/top-performers */
export async function getTopPerformers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await AnalyticsService.getTopPerformers();
    sendSuccess(res, data, 'Top performers fetched');
  } catch (err) { next(err); }
}
