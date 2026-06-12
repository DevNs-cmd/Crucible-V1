import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Global Express error handler.
 * Must be registered as the last middleware in app.ts.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ErrorHandler]', err);

  // Zod validation errors — return 422 with field details
  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 422, err.flatten().fieldErrors);
    return;
  }

  // Generic application errors
  const status = (err as { status?: number }).status ?? 500;
  const message =
    process.env['NODE_ENV'] === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  sendError(res, message, status);
}

/**
 * Middleware to catch 404 Not Found for unregistered routes.
 */
export function notFound(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}
