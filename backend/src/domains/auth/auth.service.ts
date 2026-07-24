import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/database';
import { env } from '../../config/env';
import { User, PublicUser } from '../../models/user.model';
import type { JwtPayload } from '../../middleware/auth';
import {
  clearAuthenticationFailures,
  issueRefreshToken,
  recordAuthenticationFailure,
  rotateRefreshToken,
  revokeRefreshToken,
  SecurityRequestContext,
  TokenSubject,
} from '../security/security.service';

/** Sign an access token (short-lived). */
function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * Authenticate user by email/password.
 * Returns access token, refresh token, and public user.
 */
export async function loginUser(
  email: string,
  password: string,
  context: SecurityRequestContext = {}
): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    await recordAuthenticationFailure(email, context);
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const user = data as User;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await recordAuthenticationFailure(email, context, {
      id: user.id,
      organization_id: user.organization_id ?? null,
    });
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  await clearAuthenticationFailures(email, context);

  const base: TokenSubject = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id ?? null,
  };

  const { password: _pw, ...publicUser } = user;
  return {
    accessToken: signAccessToken(base),
    refreshToken: await issueRefreshToken(base, context),
    user: publicUser,
  };
}

/**
 * Rotate a valid refresh token and issue a new access token.
 */
export async function refreshAccessToken(
  refreshToken: string,
  context: SecurityRequestContext = {}
): Promise<{ accessToken: string; refreshToken: string }> {
  const rotated = await rotateRefreshToken(refreshToken, context);
  const accessToken = signAccessToken({
    userId: rotated.subject.userId,
    email: rotated.subject.email,
    role: rotated.subject.role,
    organizationId: rotated.subject.organizationId ?? null,
  });

  return { accessToken, refreshToken: rotated.refreshToken };
}

/** Revoke a refresh token for logout when the client provides one. */
export async function logoutUser(refreshToken?: string, context: SecurityRequestContext = {}): Promise<void> {
  if (!refreshToken) {
    return;
  }

  await revokeRefreshToken(refreshToken, context);
}

/** Fetch the current user by ID (no password). */
export async function getUserById(userId: string): Promise<PublicUser> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  return data as PublicUser;
}
