import Groq from 'groq-sdk';
import { env } from './env';

/**
 * Singleton Groq client instance.
 */
export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * Model used for all AI generation tasks.
 * llama-3.3-70b-versatile: free, fast, strong JSON output.
 */
export const GROQ_MODEL = 'llama-3.3-70b-versatile' as const;
