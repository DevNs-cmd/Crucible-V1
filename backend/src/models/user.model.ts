export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

/** Safe user object — no password field */
export type PublicUser = Omit<User, 'password'>;
