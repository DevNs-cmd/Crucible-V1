import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import {
  getClientIp,
  hashIdentifier,
  incrementWindowCounter,
  recordAbuseLog,
} from '../domains/security/security.service';
import { sendError } from '../utils/response';

type RateLimitScope = 'ip' | 'email' | 'user' | 'organization';

interface RateLimitIdentity {
  scope: RateLimitScope;
  value: string;
}

interface SecurityRateLimitOptions {
  name: string;
  max: number;
  windowMs: number;
  message: string;
  includeIp?: boolean;
  includeEmail?: boolean;
  includeUser?: boolean;
  includeOrganization?: boolean;
}

function buildRateLimitKey(name: string, identity: RateLimitIdentity): string {
  return `security:rate:${name}:${identity.scope}:${hashIdentifier(identity.value)}`;
}

function getOrganizationId(req: Request): string | null {
  return req.user?.organizationId ?? req.user?.organization_id ?? null;
}

function getIdentities(req: Request, options: SecurityRateLimitOptions): RateLimitIdentity[] {
  const identities: RateLimitIdentity[] = [];

  if (options.includeOrganization) {
    const organizationId = getOrganizationId(req);
    if (organizationId) {
      identities.push({ scope: 'organization', value: organizationId });
    }
  }

  if (options.includeUser && req.user?.userId) {
    identities.push({ scope: 'user', value: req.user.userId });
  }

  if (options.includeEmail && typeof req.body?.email === 'string') {
    identities.push({ scope: 'email', value: req.body.email.toLowerCase().trim() });
  }

  if (options.includeIp || identities.length === 0) {
    identities.push({ scope: 'ip', value: getClientIp(req) });
  }

  return identities;
}

export function createSecurityRateLimiter(options: SecurityRateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identities = getIdentities(req, options);

    try {
      const results = await Promise.all(
        identities.map(async (identity) => ({
          identity,
          result: await incrementWindowCounter(buildRateLimitKey(options.name, identity), options.windowMs),
        }))
      );

      const mostConstrained = results.reduce((current, nextResult) => {
        return nextResult.result.count > current.result.count ? nextResult : current;
      }, results[0]!);

      const remaining = Math.max(0, options.max - mostConstrained.result.count);
      res.setHeader('RateLimit-Limit', String(options.max));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(Math.ceil(mostConstrained.result.resetAt.getTime() / 1000)));

      const exceeded = results.find(({ result }) => result.count > options.max);
      if (!exceeded) {
        next();
        return;
      }

      res.setHeader('Retry-After', String(Math.max(1, exceeded.result.ttlSeconds)));

      await recordAbuseLog({
        userId: req.user?.userId ?? null,
        organizationId: getOrganizationId(req),
        ipAddress: getClientIp(req),
        endpoint: `${req.method} ${req.originalUrl || req.url}`,
        userAgent: req.get('user-agent') ?? null,
        reason: 'rate_limit_exceeded',
        severity: exceeded.result.count >= options.max * 2 ? 'high' : 'medium',
        metadata: {
          limiter: options.name,
          scope: exceeded.identity.scope,
          count: exceeded.result.count,
          limit: options.max,
          window_ms: options.windowMs,
        },
      });

      sendError(res, options.message, 429);
    } catch (err) {
      console.error(`[RateLimiter] ${options.name} failed open:`, err);
      next();
    }
  };
}

/** General API - 100 req / 15 min by default. */
export const apiLimiter = createSecurityRateLimiter({
  name: 'api',
  windowMs: env.SECURITY_API_RATE_LIMIT_WINDOW_MS,
  max: env.SECURITY_API_RATE_LIMIT_MAX,
  includeIp: true,
  message: 'Too many requests, please try again later.',
});

/** Auth routes - 5 req / minute by default, limited by email and IP. */
export const authLimiter = createSecurityRateLimiter({
  name: 'auth',
  windowMs: env.SECURITY_AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.SECURITY_AUTH_RATE_LIMIT_MAX,
  includeEmail: true,
  includeIp: true,
  message: 'Too many auth attempts, please try again later.',
});

/** AI generation - 20 req / minute by default, limited by user and organization. */
export const aiLimiter = createSecurityRateLimiter({
  name: 'ai',
  windowMs: env.SECURITY_AI_RATE_LIMIT_WINDOW_MS,
  max: env.SECURITY_AI_RATE_LIMIT_MAX,
  includeOrganization: true,
  includeUser: true,
  message: 'AI generation limit reached. Try again later.',
});

/** CRM endpoints - 100 req / minute by default, limited by user and organization. */
export const crmLimiter = createSecurityRateLimiter({
  name: 'crm',
  windowMs: env.SECURITY_CRM_RATE_LIMIT_WINDOW_MS,
  max: env.SECURITY_CRM_RATE_LIMIT_MAX,
  includeOrganization: true,
  includeUser: true,
  message: 'CRM request limit reached. Try again later.',
});
