import { groq, GROQ_MODEL } from '../../config/ai';
import { supabase } from '../../config/database';
import { AUDIT_SYSTEM_PROMPT, buildAuditUserPrompt } from './prompts/audit.prompt';
import { GenerateAuditInput, AuditReport, AuditReportSchema } from '../../utils/validators';

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

/**
 * Generate an AI business audit report via Groq.
 * Validates JSON against AuditReportSchema before returning.
 */
export async function generateAuditReport(
  input: GenerateAuditInput,
  requestedBy: string
): Promise<{ report: AuditReport; generatedAt: string }> {
  let rawText: string;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: AUDIT_SYSTEM_PROMPT },
        { role: 'user', content: buildAuditUserPrompt(input) },
      ],
    });

    const choice = completion.choices[0];
    if (!choice?.message.content) {
      throw new Error('Groq returned an empty response');
    }
    rawText = choice.message.content;
  } catch (err) {
    const error = err as Error & { status?: number };
    if (error.status === 429) {
      throw Object.assign(new Error('AI rate limit reached. Please retry shortly.'), { status: 429 });
    }
    console.error('[AuditService] Groq API error:', err);
    throw Object.assign(new Error('Failed to generate audit report.'), { status: 502 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFences(rawText));
  } catch {
    console.error('[AuditService] JSON parse failed:', rawText.slice(0, 200));
    throw Object.assign(new Error('AI returned invalid JSON. Please retry.'), { status: 502 });
  }

  const validation = AuditReportSchema.safeParse(parsedJson);
  if (!validation.success) {
    console.error('[AuditService] Schema validation failed:', validation.error);
    throw Object.assign(new Error('AI report structure invalid. Please retry.'), { status: 502 });
  }

  const generatedAt = new Date().toISOString();

  // Fire-and-forget audit log
  supabase.from('audit_logs').insert({
    company_name: input.companyName,
    industry: input.industry,
    requested_by: requestedBy,
    generated_at: generatedAt,
  }).then(({ error }) => {
    if (error) console.warn('[AuditService] Failed to log audit:', error.message);
  });

  return { report: validation.data, generatedAt };
}
