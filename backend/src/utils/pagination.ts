import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Extract and normalise pagination params from query string.
 * Defaults: page=1, limit=20. Max limit capped at 100.
 */
export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt((req.query['page'] as string) || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt((req.query['limit'] as string) || '20', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
