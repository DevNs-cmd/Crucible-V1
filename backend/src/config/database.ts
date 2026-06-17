import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Singleton Supabase client using the service role key.
 * Bypasses Row Level Security — server-side use only.
 */
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
