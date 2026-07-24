import { randomUUID, createHash } from 'crypto';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/database';
import { env } from '../../config/env';
import { redisDel, redisExpire, redisIncr, redisTtl } from '../../config/redis';
import { recordActivity } from '../activity-log/activityLog.service';

const SECURITY_ENTITY_ID = '00000000-0000-0000-0000-000000000000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AbuseSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TokenSubject {
  userId: string;
  email: string;
  role: string;
  organizationId?: string | null;
}

export interface RefreshTokenClaims extends TokenSubject {
  type: 'refresh';
  sessionId: string;
  tokenFamilyId: string;
  jti: string;
  exp?: number;
  iat?: number;
}

export interface SecurityRequestContext {
  ipAddress?: string | null;
  endpoint?: string | null;
  userAgent?: string | null;
}

export interface AbuseLogEntry extends SecurityRequestContext {
  userId?: string | null;
  organizationId?: string | null;
  reason: string;
  severity: AbuseSeverity;
  metadata?: Record<string, unknown>;
}

export interface WindowCounterResult {
  count: number;
  ttlSeconds: number;
  resetAt: Date;
}

interface RefreshTokenRecord {
  id: string;
  user_id: string;
  organization_id: string | null;
  session_id: string;
  token_family_id: string;
  token_hash: string;
  replaced_by_token_hash: string | null;
  revoked_at: string | null;
  expires_at: string;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0]!.trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]!.split(',')[0]!.trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function getSecurityRequestContext(req: Request): SecurityRequestContext {
  return {
    ipAddress: getClientIp(req),
    endpoint: `${req.method} ${req.originalUrl || req.url}`,
    userAgent: req.get('user-agent') ?? null,
  };
}

export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashRefreshToken(refreshToken: string): string {
  return hashIdentifier(refreshToken);
}

export async function incrementWindowCounter(key: string, windowMs: number): Promise<WindowCounterResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const count = await redisIncr(key);

  if (count === 1) {
    await redisExpire(key, windowSeconds);
  }

  let ttlSeconds = await redisTtl(key);
  if (ttlSeconds < 0) {
    ttlSeconds = windowSeconds;
    await redisExpire(key, windowSeconds);
  }

  return {
    count,
    ttlSeconds,
    resetAt: new Date(Date.now() + ttlSeconds * 1000),
  };
}

export async function recordAbuseLog(entry: AbuseLogEntry): Promise<void> {
  const timestamp = new Date().toISOString();
  const actorId = entry.userId && UUID_PATTERN.test(entry.userId) ? entry.userId : null;

  await recordActivity({
    entity_type: 'security',
    entity_id: SECURITY_ENTITY_ID,
    action: 'security_alert',
    actor_id: actorId,
    before_state: null,
    after_state: {
      reason: entry.reason,
      severity: entry.severity,
      timestamp,
    },
    metadata: {
      timestamp,
      user_id: entry.userId ?? null,
      organization_id: entry.organizationId ?? null,
      ip_address: entry.ipAddress ?? null,
      endpoint: entry.endpoint ?? null,
      reason: entry.reason,
      severity: entry.severity,
      user_agent: entry.userAgent ?? null,
      ...(entry.metadata ?? {}),
    },
  });
}

export async function recordAuthenticationFailure(
  email: string,
  context: SecurityRequestContext,
  user?: { id?: string | null; organization_id?: string | null }
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const ipAddress = context.ipAddress ?? 'unknown';
  const key = `security:auth_failure:${hashIdentifier(`${normalizedEmail}:${ipAddress}`)}`;

  try {
    const result = await incrementWindowCounter(key, env.SECURITY_AUTH_FAILURE_WINDOW_MS);
    if (result.count < env.SECURITY_AUTH_FAILURE_MAX) {
      return;
    }

    await recordAbuseLog({
      ...context,
      userId: user?.id ?? null,
      organizationId: user?.organization_id ?? null,
      reason: 'repeated_authentication_failures',
      severity: result.count >= env.SECURITY_AUTH_FAILURE_MAX * 2 ? 'high' : 'medium',
      metadata: {
        auth_failure_count: result.count,
        auth_failure_threshold: env.SECURITY_AUTH_FAILURE_MAX,
        window_ms: env.SECURITY_AUTH_FAILURE_WINDOW_MS,
        email_hash: hashIdentifier(normalizedEmail),
      },
    });
  } catch (err) {
    console.error('[Security] Failed to record authentication failure:', err);
  }
}

export async function clearAuthenticationFailures(email: string, context: SecurityRequestContext): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const ipAddress = context.ipAddress ?? 'unknown';
  const key = `security:auth_failure:${hashIdentifier(`${normalizedEmail}:${ipAddress}`)}`;

  try {
    await redisDel(key);
  } catch (err) {
    console.error('[Security] Failed to clear authentication failures:', err);
  }
}

export async function issueRefreshToken(
  subject: TokenSubject,
  context: SecurityRequestContext
): Promise<string> {
  return createAndStoreRefreshToken({
    ...subject,
    sessionId: randomUUID(),
    tokenFamilyId: randomUUID(),
  }, context);
}

export async function rotateRefreshToken(
  refreshToken: string,
  context: SecurityRequestContext
): Promise<{ subject: TokenSubject; refreshToken: string }> {
  const decoded = verifyRefreshToken(refreshToken);
  const tokenHash = hashRefreshToken(refreshToken);
  const existing = await findRefreshTokenByHash(tokenHash);

  if (!existing || existing.revoked_at || existing.replaced_by_token_hash) {
    await handleRefreshTokenReplay(decoded, context, existing ?? undefined);
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  if (new Date(existing.expires_at).getTime() <= Date.now()) {
    await revokeRefreshTokenSession(existing.session_id, 'refresh_token_expired');
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const nextRefreshToken = signRefreshToken({
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    organizationId: decoded.organizationId ?? existing.organization_id,
    sessionId: existing.session_id,
    tokenFamilyId: existing.token_family_id,
  });
  const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);

  const rotated = await markRefreshTokenRotated(existing.id, nextRefreshTokenHash);
  if (!rotated) {
    await handleRefreshTokenReplay(decoded, context, existing);
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  await insertRefreshTokenRecord({
    subject: {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId ?? existing.organization_id,
    },
    sessionId: existing.session_id,
    tokenFamilyId: existing.token_family_id,
    refreshToken: nextRefreshToken,
    refreshTokenHash: nextRefreshTokenHash,
    context,
  });

  return {
    subject: {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId ?? existing.organization_id,
    },
    refreshToken: nextRefreshToken,
  };
}

export async function revokeRefreshToken(
  refreshToken: string,
  context: SecurityRequestContext,
  reason = 'logout'
): Promise<void> {
  let decoded: RefreshTokenClaims | null = null;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const unsafeDecoded = jwt.decode(refreshToken) as Partial<RefreshTokenClaims> | null;
    decoded = unsafeDecoded?.sessionId ? (unsafeDecoded as RefreshTokenClaims) : null;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  try {
    await supabase
      .from('refresh_tokens')
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null);
  } catch (err) {
    console.error('[Security] Failed to revoke refresh token:', err);
  }

  if (reason !== 'logout' && decoded) {
    await recordAbuseLog({
      ...context,
      userId: decoded.userId,
      organizationId: decoded.organizationId ?? null,
      reason,
      severity: 'high',
      metadata: {
        session_id: decoded.sessionId,
        token_family_id: decoded.tokenFamilyId,
      },
    });
  }
}

function verifyRefreshToken(refreshToken: string): RefreshTokenClaims {
  let decoded: RefreshTokenClaims;

  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET) as RefreshTokenClaims;
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  if (
    decoded.type !== 'refresh' ||
    !decoded.userId ||
    !decoded.email ||
    !decoded.role ||
    !decoded.sessionId ||
    !decoded.tokenFamilyId ||
    !decoded.jti
  ) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  return decoded;
}

function signRefreshToken(
  claims: TokenSubject & { sessionId: string; tokenFamilyId: string }
): string {
  return jwt.sign(
    {
      userId: claims.userId,
      email: claims.email,
      role: claims.role,
      organizationId: claims.organizationId ?? null,
      type: 'refresh',
      sessionId: claims.sessionId,
      tokenFamilyId: claims.tokenFamilyId,
      jti: randomUUID(),
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

async function createAndStoreRefreshToken(
  claims: TokenSubject & { sessionId: string; tokenFamilyId: string },
  context: SecurityRequestContext
): Promise<string> {
  const refreshToken = signRefreshToken(claims);
  await insertRefreshTokenRecord({
    subject: claims,
    sessionId: claims.sessionId,
    tokenFamilyId: claims.tokenFamilyId,
    refreshToken,
    refreshTokenHash: hashRefreshToken(refreshToken),
    context,
  });

  return refreshToken;
}

async function insertRefreshTokenRecord(input: {
  subject: TokenSubject;
  sessionId: string;
  tokenFamilyId: string;
  refreshToken: string;
  refreshTokenHash: string;
  context: SecurityRequestContext;
}): Promise<void> {
  const expiresAt = getRefreshTokenExpiresAt(input.refreshToken);
  const { error } = await supabase
    .from('refresh_tokens')
    .insert({
      user_id: input.subject.userId,
      organization_id: input.subject.organizationId ?? null,
      session_id: input.sessionId,
      token_family_id: input.tokenFamilyId,
      token_hash: input.refreshTokenHash,
      expires_at: expiresAt,
      ip_address: input.context.ipAddress ?? null,
      user_agent: input.context.userAgent ?? null,
    });

  if (error) {
    throw Object.assign(new Error(`Failed to persist refresh token: ${error.message}`), { status: 500 });
  }
}

async function findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) {
    return null;
  }

  return data as RefreshTokenRecord;
}

async function markRefreshTokenRotated(
  tokenId: string,
  replacedByTokenHash: string
): Promise<RefreshTokenRecord | null> {
  const { data, error } = await supabase
    .from('refresh_tokens')
    .update({
      revoked_at: new Date().toISOString(),
      replaced_by_token_hash: replacedByTokenHash,
      revocation_reason: 'rotated',
      last_used_at: new Date().toISOString(),
    })
    .eq('id', tokenId)
    .is('revoked_at', null)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data as RefreshTokenRecord;
}

async function revokeRefreshTokenSession(sessionId: string, reason: string): Promise<void> {
  try {
    await supabase
      .from('refresh_tokens')
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('session_id', sessionId)
      .is('revoked_at', null);
  } catch (err) {
    console.error('[Security] Failed to revoke refresh token session:', err);
  }
}

async function handleRefreshTokenReplay(
  decoded: RefreshTokenClaims,
  context: SecurityRequestContext,
  existing?: RefreshTokenRecord
): Promise<void> {
  await revokeRefreshTokenSession(existing?.session_id ?? decoded.sessionId, 'refresh_token_replay');
  await recordAbuseLog({
    ...context,
    userId: decoded.userId,
    organizationId: decoded.organizationId ?? existing?.organization_id ?? null,
    reason: 'refresh_token_replay',
    severity: 'critical',
    metadata: {
      session_id: existing?.session_id ?? decoded.sessionId,
      token_family_id: existing?.token_family_id ?? decoded.tokenFamilyId,
      replayed_jti_hash: hashIdentifier(decoded.jti),
    },
  });
}

function getRefreshTokenExpiresAt(refreshToken: string): string {
  const decoded = jwt.decode(refreshToken) as RefreshTokenClaims | null;
  if (!decoded?.exp) {
    throw Object.assign(new Error('Refresh token missing expiration'), { status: 500 });
  }

  return new Date(decoded.exp * 1000).toISOString();
}
