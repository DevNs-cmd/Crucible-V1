import { Request, Response, NextFunction } from 'express';
import * as ActivityLogService from '../activity-log/activityLog.service';
import { ActivityLogFilterSchema } from '../../utils/validators';
import { sendSuccess, sendError } from '../../utils/response';
import { getPagination } from '../../utils/pagination';

/** GET /api/activity-log */
export async function getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filterParsed = ActivityLogFilterSchema.safeParse(req.query);
    if (!filterParsed.success) {
      sendError(res, 'Invalid query parameters', 422, filterParsed.error.flatten().fieldErrors);
      return;
    }

    const pagination = getPagination(req);
    const { logs, total } = await ActivityLogService.getActivityLogs(
      {
        entity_type: filterParsed.data.entity_type,
        entity_id: filterParsed.data.entity_id,
      },
      pagination
    );

    sendSuccess(res, logs, 'Activity logs fetched', 200, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (err) {
    next(err);
  }
}
