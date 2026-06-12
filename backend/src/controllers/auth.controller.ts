import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { LoginSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/**
 * POST /api/auth/login
 * Validate credentials and return a JWT + public user object.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    const { token, user } = await AuthService.loginUser(parsed.data.email, parsed.data.password);
    sendSuccess(res, { token, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Stateless logout — client is responsible for discarding the token.
 */
export function logout(_req: Request, res: Response): void {
  sendSuccess(res, null, 'Logged out successfully');
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await AuthService.getUserById(req.user!.userId);
    sendSuccess(res, user, 'User fetched successfully');
  } catch (err) {
    next(err);
  }
}
