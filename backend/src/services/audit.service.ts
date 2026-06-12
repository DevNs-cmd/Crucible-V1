import { anthropic, CLAUDE_MODEL } from '../config/ai';
import { supabase } from '../config/database';
import { AUDIT_SYSTEM_PROMPT, buildAuditUserPrompt } from '../prompts/audit.prompt';
import { GenerateAuditInput, AuditReport, AuditReportSchema } from '../utils/validators';

/**
 * Generate an AI business audit report using Claude.
 * Validates the response against the expected schema before returning.
 */
export async function generateAuditReport(
  input: GenerateAuditInput,
  requestedBy: string
): Promise<{ report: AuditReport; generatedAt: string }> {
  const userPrompt = buildAuditUserPrompt(input);

  let rawText: string;

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: AUDIT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const firstBlock = message.content[0];
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('Claude returned an unexpected response format');
    }

    rawText = firstBlock.text;
  } catch (err) {
    const error = err as Error & { status?: number };

    // Surface specific API error types for better debugging
    if (error.status === 429) {
      throw Object.assign(new Error('AI rate limit reached. Please try again shortly.'), {
        status: 429,
      });
    }
    if (error.status === 529) {
      throw Object.assign(new Error('AI service is temporarily overloaded. Please try again.'), {
        status: 503,
      });
    }

    console.error('[AuditService] Claude API error:', err);
    throw Object.assign(new Error('Failed to generate audit report. Please try again.'), {
      status: 502,
    });
  }

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleanedText);
  } catch {
    console.error('[AuditService] Failed to parse Claude response as JSON:', cleanedText);
    throw Object.assign(new Error('AI returned invalid JSON. Please try again.'), { status: 502 });
  }

  // Validate the shape with Zod
  const validation = AuditReportSchema.safeParse(parsedJson);
  if (!validation.success) {
    console.error('[AuditService] Claude response failed schema validation:', validation.error);
    throw Object.assign(
      new Error('AI report structure was invalid. Please try again.'),
      { status: 502 }
    );
  }

  const generatedAt = new Date().toISOString();

  // Log the audit generation to Supabase (fire-and-forget — don't block response)
  supabase
    .from('audit_logs')
    .insert({
      company_name: input.companyName,
      industry: input.industry,
      requested_by: requestedBy,
      generated_at: generatedAt,
    })
    .then(({ error }) => {
      if (error) console.warn('[AuditService] Failed to log audit to DB:', error.message);
    });

  return { report: validation.data, generatedAt };
}
