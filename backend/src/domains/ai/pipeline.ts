import { z } from 'zod';
import { groq, GROQ_MODEL } from '../../config/ai';
import { supabase } from '../../config/database';
import { AUDIT_SYSTEM_PROMPT, buildAuditUserPrompt } from './prompts/audit.prompt';
import { PROPOSAL_SYSTEM_PROMPT, buildProposalUserPrompt } from './prompts/proposal.prompt';
import {
  AuditReportSchema,
  ProposalSchema,
} from '../../utils/validators';

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

/**
 * 1. normalizeInput(input) — trim strings, collapse whitespace, drop empty optional fields,
 * de-duplicate any list-type inputs (e.g. repeated services/products mentioned).
 */
export function normalizeInput<T extends Record<string, any>>(input: T): T {
  const normalized = {} as any;

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      const normalizedStr = value.replace(/\s+/g, ' ').trim();
      // Drop empty optional fields
      if ((key === 'contactName' || key === 'contactEmail') && normalizedStr === '') {
        continue;
      }
      normalized[key] = normalizedStr;
    } else if (Array.isArray(value)) {
      const cleaned = value
        .map(item => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim() : item))
        .filter(item => item !== '');
      normalized[key] = Array.from(new Set(cleaned));
    } else if (value === null || value === undefined) {
      if (key === 'contactName' || key === 'contactEmail') {
        continue;
      }
      normalized[key] = value;
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Helper to fetch last 1-2 reports from ai_jobs for the same companyName.
 */
export async function getPriorReports(type: 'audit' | 'proposal', companyName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('ai_jobs')
      .select('result, created_at')
      .eq('job_type', type)
      .eq('status', 'completed')
      .eq('input->>companyName', companyName)
      .order('created_at', { ascending: false })
      .limit(2);

    if (error) {
      console.warn(`[AiPipeline] Failed to query prior reports from ai_jobs:`, error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn(`[AiPipeline] Error fetching prior reports:`, err.message);
    return [];
  }
}

/**
 * 2. buildContext(input, priorReports?) — assembles the context block for the prompt.
 * Include a lightweight "AI memory" step here: query the last 1-2 reports generated for the same company_name
 * and include a short 2-3 sentence summary of prior context in the prompt if found.
 */
export async function buildContext(
  type: 'audit' | 'proposal',
  input: any,
  priorReports?: any[]
): Promise<string> {
  let reports = priorReports;
  if (!reports) {
    reports = await getPriorReports(type, input.companyName);
  }

  if (reports && reports.length > 0) {
    const summaries = reports
      .map((r, idx) => {
        const date = r.created_at || r.generated_at ? new Date(r.created_at || r.generated_at).toLocaleDateString() : 'recently';
        const resultData = r.result || r;
        if (!resultData) return '';

        // Extract report or proposal object
        const actualReport = resultData.report || (resultData.executiveSummary ? resultData : null);
        const actualProposal = resultData.proposal || (resultData.introduction ? resultData : null);

        if (actualReport) {
          const execSummary = actualReport.executiveSummary || '';
          const sentences = execSummary.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
          return `Prior Audit Report ${idx + 1} (${date}): ${sentences}`;
        } else if (actualProposal) {
          const intro = actualProposal.introduction || '';
          const sentences = intro.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
          return `Prior Proposal ${idx + 1} (${date}): ${sentences}`;
        }
        return '';
      })
      .filter(Boolean);

    if (summaries.length > 0) {
      return `Prior Context / Historical AI Memory:\n${summaries.join('\n')}\nUse the above historical context to ensure continuity and consistency where relevant.`;
    }
  }

  return '';
}

/**
 * 3. selectPrompt(input) — thin wrapper choosing between existing audit/proposal prompt builders.
 */
export function selectPrompt(type: 'audit' | 'proposal', input: any): { systemPrompt: string; userPrompt: string } {
  if (type === 'audit') {
    return {
      systemPrompt: AUDIT_SYSTEM_PROMPT,
      userPrompt: buildAuditUserPrompt(input),
    };
  } else {
    return {
      systemPrompt: PROPOSAL_SYSTEM_PROMPT,
      userPrompt: buildProposalUserPrompt(input),
    };
  }
}

/**
 * 4. callModel(prompt) — the existing Groq call, unchanged.
 */
export async function callModel(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000,
  chatHistory: any[] = []
): Promise<string> {
  try {
    const messages =
      chatHistory.length > 0
        ? chatHistory
        : [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages,
    });

    const choice = completion.choices[0];
    if (!choice?.message.content) {
      throw new Error('Groq returned an empty response');
    }
    return choice.message.content;
  } catch (err: any) {
    if (err.status === 429) {
      throw Object.assign(new Error('AI rate limit reached. Please retry shortly.'), { status: 429 });
    }
    console.error('[AiPipeline] Groq API error:', err);
    throw Object.assign(new Error('Failed to generate report/proposal via AI.'), { status: 502 });
  }
}

/**
 * 5. validateResponse(raw, schema) — existing code-fence-stripping + Zod parse.
 * On failure, retry ONCE with a corrective system message appended.
 */
export async function validateResponse<Schema extends z.ZodSchema>(
  raw: string,
  schema: Schema,
  onRetry?: (correctiveMessage: string) => Promise<string>
): Promise<{ data: z.infer<Schema>; retryNeeded: boolean }> {
  let textToParse = raw;
  let parsedJson: unknown;
  let parseErrorSummary = '';

  try {
    parsedJson = JSON.parse(stripCodeFences(textToParse));
  } catch (err) {
    parseErrorSummary = 'Invalid JSON format: JSON parsing failed.';
  }

  if (!parseErrorSummary) {
    const validation = schema.safeParse(parsedJson);
    if (validation.success) {
      return { data: validation.data, retryNeeded: false };
    } else {
      parseErrorSummary = validation.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
    }
  }

  if (onRetry) {
    console.warn(`[AiPipeline] Validation failed (${parseErrorSummary}). Retrying once...`);
    const correctiveMessage = `Your previous response was invalid JSON: ${parseErrorSummary}. Return ONLY valid JSON matching the schema, no other text.`;
    const retriedRaw = await onRetry(correctiveMessage);
    // Recursively validate but without providing the onRetry callback again to enforce SINGLE retry limit
    const secondValidation = await validateResponse(retriedRaw, schema);
    return { data: secondValidation.data, retryNeeded: true };
  }

  throw Object.assign(new Error(`AI response structure invalid: ${parseErrorSummary}`), { status: 502 });
}

const CRITIC_SYSTEM_PROMPT = `You are a critical quality control agent. Your job is to evaluate an AI-generated business report or proposal against the original input provided by the user.

Evaluate the report/proposal based on:
1. Fabricated Facts: Are there any fabricated facts or claims not supported by or present in the original input?
2. Internal Inconsistency: Are there contradictory claims or timelines in the generated content?
3. Relevance: Is the output directly relevant to the user's input and stated problems?

CRITICAL INSTRUCTIONS:
1. Respond ONLY with a single valid JSON object — no markdown, no code fences, no explanation.
2. The JSON object must have exactly these keys:
{
  "passed": boolean,
  "notes": "string - explaining any issues found, or detailing why it passed"
}`;

function buildCriticUserPrompt(input: any, output: any): string {
  return `Original Input:
${JSON.stringify(input, null, 2)}

Generated Output:
${JSON.stringify(output, null, 2)}

Evaluate the Generated Output against the Original Input. Respond ONLY with the JSON object.`;
}

/**
 * 6. criticPass(validatedOutput, input) — a second, smaller/cheaper Groq call (same model is fine)
 * that checks the generated report against the original input for fabricated facts, consistency, and relevance.
 */
export async function criticPass(
  validatedOutput: any,
  input: any
): Promise<{ passed: boolean; notes: string }> {
  try {
    const systemPrompt = CRITIC_SYSTEM_PROMPT;
    const userPrompt = buildCriticUserPrompt(input, validatedOutput);

    const rawResult = await callModel(systemPrompt, userPrompt, 1000);
    const parsed = JSON.parse(stripCodeFences(rawResult));

    const passed = typeof parsed.passed === 'boolean' ? parsed.passed : false;
    const notes = typeof parsed.notes === 'string' ? parsed.notes : 'No notes provided by critic.';

    return { passed, notes };
  } catch (err: any) {
    console.error('[AiPipeline] Critic pass failed to execute:', err.message);
    return {
      passed: false,
      notes: `Critic evaluation failed to execute: ${err.message}`,
    };
  }
}

/**
 * 7. scoreConfidence(validatedOutput, criticResult, retryCount, type) — simple heuristic 0-100.
 */
export function scoreConfidence(
  validatedOutput: any,
  criticResult: { passed: boolean; notes: string },
  retryCount: number,
  type: 'audit' | 'proposal'
): number {
  let score = 100;

  if (retryCount > 0) {
    score -= 30;
  }

  if (!criticResult.passed) {
    score -= 25;
  }

  const jsonStr = JSON.stringify(validatedOutput);
  const len = jsonStr.length;

  if (type === 'audit') {
    if (len < 1500) {
      score -= 20;
    } else if (len > 10000) {
      score -= 10;
    }
  } else {
    if (len < 2000) {
      score -= 20;
    } else if (len > 15000) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Orchestrator function runAiPipeline(type, input, requestedBy?)
 */
export async function runAiPipeline(
  type: 'audit' | 'proposal',
  input: any,
  requestedBy?: string
): Promise<{ result: any; confidenceScore: number; criticNotes: string | null }> {
  const normalized = normalizeInput(input);
  const schema = type === 'audit' ? AuditReportSchema : ProposalSchema;
  const maxTokens = type === 'audit' ? 2000 : 3000;

  // AI Memory / Context
  const context = await buildContext(type, normalized);

  // Select Prompts
  const prompts = selectPrompt(type, normalized);
  const finalUserPrompt = context ? `${prompts.userPrompt}\n\n${context}` : prompts.userPrompt;

  let rawText = await callModel(prompts.systemPrompt, finalUserPrompt, maxTokens);

  let retryCount = 0;
  const onRetry = async (correctiveMessage: string) => {
    retryCount++;
    const chatHistory = [
      { role: 'system', content: prompts.systemPrompt },
      { role: 'user', content: finalUserPrompt },
      { role: 'assistant', content: rawText },
      { role: 'system', content: correctiveMessage },
    ];
    return callModel(prompts.systemPrompt, finalUserPrompt, maxTokens, chatHistory);
  };

  const validationResult = await validateResponse(rawText, schema, onRetry);

  // Critic Pass
  const criticResult = await criticPass(validationResult.data, normalized);

  // Score Confidence
  const confidenceScore = scoreConfidence(validationResult.data, criticResult, retryCount, type);

  // Fire-and-forget log insertion for audit_logs / proposal_logs
  if (requestedBy) {
    const generatedAt = new Date().toISOString();
    const logTable = type === 'audit' ? 'audit_logs' : 'proposal_logs';
    supabase
      .from(logTable)
      .insert({
        company_name: normalized.companyName,
        industry: normalized.industry,
        requested_by: requestedBy,
        generated_at: generatedAt,
      })
      .then(({ error }) => {
        if (error) {
          console.warn(`[AiPipeline] Failed to log ${type} event:`, error.message);
        }
      });
  }

  return {
    result: validationResult.data,
    confidenceScore,
    criticNotes: criticResult.notes,
  };
}
