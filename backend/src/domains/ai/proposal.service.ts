import { runAiPipeline } from './pipeline';
import { GenerateProposalInput, Proposal } from '../../utils/validators';

/**
 * Generate a professional sales proposal via the AI Pipeline.
 * Wraps runAiPipeline for backward compatibility.
 */
export async function generateProposal(
  input: GenerateProposalInput,
  requestedBy: string
): Promise<{ proposal: Proposal; generatedAt: string }> {
  const { result } = await runAiPipeline('proposal', input, requestedBy);
  return {
    proposal: result,
    generatedAt: new Date().toISOString(),
  };
}
