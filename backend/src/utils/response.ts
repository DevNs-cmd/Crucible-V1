import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  pagination?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Send a standardised 200 success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  status = 200,
  pagination?: PaginationMeta
): void {
  const body: SuccessResponse<T> = { success: true, data, message };
  if (pagination) body.pagination = pagination;
  res.status(status).json(body);
}

/**
 * Send a standardised error response.
 */
export function sendError(
  res: Response,
  error: string,
  status = 400,
  details?: unknown
): void {
  const body: ErrorResponse = { success: false, error };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}
