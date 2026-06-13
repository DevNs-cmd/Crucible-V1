import Groq from 'groq-sdk';
import { env } from './env';

/**
 * Singleton Groq client instance.
 */
export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * Groq model to use for audit generation.
 * llama-3.3-70b-versatile is free, fast, and strong at structured JSON output.
 */
export const GROQ_MODEL = 'llama-3.3-70b-versatile' as const;
