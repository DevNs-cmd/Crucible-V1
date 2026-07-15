import { runAiPipeline } from './pipeline';
import { GenerateAuditInput, AuditReport } from '../../utils/validators';

/**
 * Generate an AI business audit report via the AI Pipeline.
 * Wraps runAiPipeline for backward compatibility.
 */
export async function generateAuditReport(
  input: GenerateAuditInput,
  requestedBy: string
): Promise<{ report: AuditReport; generatedAt: string }> {
  const { result } = await runAiPipeline('audit', input, requestedBy);
  return {
    report: result,
    generatedAt: new Date().toISOString(),
  };
}
