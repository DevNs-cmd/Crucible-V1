import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { env } from '../config/env';
import { User, PublicUser } from '../models/user.model';
import { JwtPayload } from '../middleware/auth';

/**
 * Authenticate a user by email and password.
 * Returns a signed JWT and the public user object.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: PublicUser }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const user = data as User;
  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const { password: _pw, ...publicUser } = user;

  return { token, user: publicUser };
}

/**
 * Fetch the current user record by ID from Supabase.
 */
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
