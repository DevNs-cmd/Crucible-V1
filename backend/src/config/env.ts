import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  SECURITY_AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  SECURITY_AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 1000),
  SECURITY_AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  SECURITY_AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 1000),
  SECURITY_CRM_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  SECURITY_CRM_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 1000),
  SECURITY_API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  SECURITY_API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  SECURITY_AUTH_FAILURE_MAX: z.coerce.number().int().positive().default(5),
  SECURITY_AUTH_FAILURE_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),

  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

  N8N_WEBHOOK_NEW_LEAD: z.string().url({ message: 'N8N_WEBHOOK_NEW_LEAD must be a valid URL' }),
  N8N_WEBHOOK_STATUS_CHANGE: z.string().url({ message: 'N8N_WEBHOOK_STATUS_CHANGE must be a valid URL' }),
  N8N_WEBHOOK_FOLLOWUP_REMINDER: z.string().url({ message: 'N8N_WEBHOOK_FOLLOWUP_REMINDER must be a valid URL' }),

  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().min(1, 'SMTP_FROM is required'),

  ENABLE_CRON: z.string().default('false').transform((v) => v === 'true'),
});

/**
 * Validated environment variables. Crashes the process at startup if any
 * required variable is missing or malformed — fail fast, never silently.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
