import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { env } from '../config/env';
import { User, PublicUser } from '../models/user.model';
import { JwtPayload } from '../middleware/auth';

/** Sign an access token (short-lived). */
function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

/** Sign a refresh token (long-lived). */
function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * Authenticate user by email/password.
 * Returns access token, refresh token, and public user.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const user = data as User;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const base: Omit<JwtPayload, 'type'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const { password: _pw, ...publicUser } = user;
  return {
    accessToken: signAccessToken(base),
    refreshToken: signRefreshToken(base),
    user: publicUser,
  };
}

/**
 * Issue a new access token from a valid refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string }> {
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  if (decoded.type !== 'refresh') {
    throw Object.assign(new Error('Invalid token type'), { status: 401 });
  }

  const accessToken = signAccessToken({
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  });

  return { accessToken };
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
