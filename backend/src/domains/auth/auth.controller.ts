import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../auth/auth.service';
import { LoginSchema, RefreshTokenSchema } from '../../utils/validators';
import { sendSuccess, sendError } from '../../utils/response';

/** POST /api/auth/login */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await AuthService.loginUser(parsed.data.email, parsed.data.password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/refresh */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = RefreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await AuthService.refreshAccessToken(parsed.data.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout */
export function logout(_req: Request, res: Response): void {
  sendSuccess(res, null, 'Logged out successfully');
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await AuthService.getUserById(req.user!.userId);
    sendSuccess(res, user, 'User fetched successfully');
  } catch (err) {
    next(err);
  }
}
