import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

/**
 * Singleton Anthropic client instance.
 */
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

/** The Claude model to use for all AI calls. */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514' as const;
