import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../auth/auth.service';
import { LoginSchema, RefreshTokenSchema } from '../../utils/validators';
import { sendSuccess, sendError } from '../../utils/response';
import { getSecurityRequestContext } from '../security/security.service';

/** POST /api/auth/login */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const result = await AuthService.loginUser(
      parsed.data.email,
      parsed.data.password,
      getSecurityRequestContext(req)
    );
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
    const result = await AuthService.refreshAccessToken(
      parsed.data.refreshToken,
      getSecurityRequestContext(req)
    );
    sendSuccess(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = RefreshTokenSchema.partial().safeParse(req.body ?? {});
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    await AuthService.logoutUser(parsed.data.refreshToken, getSecurityRequestContext(req));
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
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
