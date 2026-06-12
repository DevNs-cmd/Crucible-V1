/** Represents a row in the `users` table. */
export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

/** User without the password field — safe to return in API responses. */
export type PublicUser = Omit<User, 'password'>;
