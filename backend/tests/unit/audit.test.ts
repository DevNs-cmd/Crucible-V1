import { GenerateAuditSchema, AuditReportSchema } from '../../src/utils/validators';
import { buildAuditUserPrompt, AUDIT_SYSTEM_PROMPT } from '../../src/prompts/audit.prompt';

const validInput = {
  companyName: 'TechCorp',
  industry: 'SaaS',
  companyType: 'B2B Startup',
  companySize: '11-50',
  problems: ['High churn', 'Manual onboarding'],
  currentTools: ['HubSpot'],
  budget: 'medium' as const,
};

describe('GenerateAuditSchema', () => {
  it('accepts valid input', () => { expect(GenerateAuditSchema.safeParse(validInput).success).toBe(true); });
  it('rejects empty companyName', () => { expect(GenerateAuditSchema.safeParse({ ...validInput, companyName: '' }).success).toBe(false); });
  it('rejects empty problems array', () => { expect(GenerateAuditSchema.safeParse({ ...validInput, problems: [] }).success).toBe(false); });
  it('rejects invalid budget', () => { expect(GenerateAuditSchema.safeParse({ ...validInput, budget: 'ultra' }).success).toBe(false); });
  it('defaults currentTools to []', () => {
    const { currentTools: _t, ...without } = validInput;
    const r = GenerateAuditSchema.safeParse(without);
    expect(r.success && r.data.currentTools).toEqual([]);
  });
});

describe('buildAuditUserPrompt', () => {
  it('includes company name', () => { expect(buildAuditUserPrompt(validInput)).toContain('TechCorp'); });
  it('includes all problems', () => { expect(buildAuditUserPrompt(validInput)).toContain('High churn'); });
  it('includes tools', () => { expect(buildAuditUserPrompt(validInput)).toContain('HubSpot'); });
  it('handles empty tools', () => { expect(buildAuditUserPrompt({ ...validInput, currentTools: [] })).toContain('None specified'); });
});

describe('AUDIT_SYSTEM_PROMPT', () => {
  it('instructs JSON-only response', () => { expect(AUDIT_SYSTEM_PROMPT).toContain('ONLY with a single valid JSON object'); });
});

const validReport = {
  executiveSummary: 'Summary here.',
  painPoints: [{ title: 'Pain', description: 'Desc', severity: 'high' as const }],
  recommendations: [{ title: 'Rec', description: 'Desc', priority: 1, estimatedImpact: '30%' }],
  aiOpportunities: [{ area: 'Sales', solution: 'AI scoring', tools: ['HubSpot'], difficulty: 'easy' as const }],
  estimatedROI: '25-40% in 6 months',
  implementationRoadmap: [{ phase: 1, title: 'Foundation', duration: 'Weeks 1-4', tasks: ['Setup CRM'] }],
};

describe('AuditReportSchema', () => {
  it('accepts valid report', () => { expect(AuditReportSchema.safeParse(validReport).success).toBe(true); });
  it('rejects invalid severity', () => {
    expect(AuditReportSchema.safeParse({ ...validReport, painPoints: [{ ...validReport.painPoints[0], severity: 'critical' }] }).success).toBe(false);
  });
  it('rejects invalid difficulty', () => {
    expect(AuditReportSchema.safeParse({ ...validReport, aiOpportunities: [{ ...validReport.aiOpportunities[0], difficulty: 'extreme' }] }).success).toBe(false);
  });
});
