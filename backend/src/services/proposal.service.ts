import { groq, GROQ_MODEL } from '../config/ai';
import { supabase } from '../config/database';
import { PROPOSAL_SYSTEM_PROMPT, buildProposalUserPrompt } from '../prompts/proposal.prompt';
import { GenerateProposalInput, Proposal, ProposalSchema } from '../utils/validators';

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

/**
 * Generate a professional sales proposal via Groq.
 * Validates JSON against ProposalSchema before returning.
 */
export async function generateProposal(
  input: GenerateProposalInput,
  requestedBy: string
): Promise<{ proposal: Proposal; generatedAt: string }> {
  let rawText: string;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: PROPOSAL_SYSTEM_PROMPT },
        { role: 'user', content: buildProposalUserPrompt(input) },
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
    console.error('[ProposalService] Groq API error:', err);
    throw Object.assign(new Error('Failed to generate proposal.'), { status: 502 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFences(rawText));
  } catch {
    console.error('[ProposalService] JSON parse failed:', rawText.slice(0, 200));
    throw Object.assign(new Error('AI returned invalid JSON. Please retry.'), { status: 502 });
  }

  const validation = ProposalSchema.safeParse(parsedJson);
  if (!validation.success) {
    console.error('[ProposalService] Schema validation failed:', validation.error);
    throw Object.assign(new Error('AI proposal structure invalid. Please retry.'), { status: 502 });
  }

  const generatedAt = new Date().toISOString();

  // Fire-and-forget log
  supabase.from('proposal_logs').insert({
    company_name: input.companyName,
    industry: input.industry,
    requested_by: requestedBy,
    generated_at: generatedAt,
  }).then(({ error }) => {
    if (error) console.warn('[ProposalService] Failed to log proposal:', error.message);
  });

  return { proposal: validation.data, generatedAt };
}
