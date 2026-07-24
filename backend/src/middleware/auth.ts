import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/response';
import { getClientIp, recordAbuseLog } from '../domains/security/security.service';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string | null;
  organization_id?: string | null;
  type: 'access' | 'refresh';
  sessionId?: string;
  tokenFamilyId?: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies Bearer JWT from Authorization header.
 * Attaches decoded payload to req.user on success.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authorization header missing or malformed', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    sendError(res, 'Token not provided', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (decoded.type !== 'access') {
      logSuspiciousRequest(req, 'invalid_access_token_type', decoded);
      sendError(res, 'Invalid token type', 401);
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token has expired', 401);
    } else {
      logSuspiciousRequest(req, 'invalid_access_token');
      sendError(res, 'Invalid token', 401);
    }
  }
}

/**
 * Restricts access to specific roles. Must be used after authenticate.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}

function logSuspiciousRequest(req: Request, reason: string, decoded?: Partial<JwtPayload>): void {
  recordAbuseLog({
    userId: decoded?.userId ?? null,
    organizationId: decoded?.organizationId ?? decoded?.organization_id ?? null,
    ipAddress: getClientIp(req),
    endpoint: `${req.method} ${req.originalUrl || req.url}`,
    userAgent: req.get('user-agent') ?? null,
    reason,
    severity: 'low',
  }).catch((err) => {
    console.error('[Auth] Failed to record suspicious auth request:', err);
  });
}
