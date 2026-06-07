import { GenerateAuditSchema, AuditReportSchema } from '../../src/utils/validators';
import { buildAuditUserPrompt, AUDIT_SYSTEM_PROMPT } from '../../src/prompts/audit.prompt';

describe('GenerateAuditSchema validation', () => {
  const validInput = {
    companyName: 'TechCorp',
    industry: 'SaaS',
    companyType: 'B2B Startup',
    companySize: '11-50',
    problems: ['High churn rate', 'Manual onboarding'],
    currentTools: ['HubSpot', 'Slack'],
    budget: 'medium' as const,
  };

  it('accepts valid audit input', () => {
    const result = GenerateAuditSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing companyName', () => {
    const result = GenerateAuditSchema.safeParse({ ...validInput, companyName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty problems array', () => {
    const result = GenerateAuditSchema.safeParse({ ...validInput, problems: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid budget value', () => {
    const result = GenerateAuditSchema.safeParse({ ...validInput, budget: 'very-high' });
    expect(result.success).toBe(false);
  });

  it('defaults currentTools to empty array', () => {
    const { currentTools: _t, ...withoutTools } = validInput;
    const result = GenerateAuditSchema.safeParse(withoutTools);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentTools).toEqual([]);
    }
  });
});

describe('Audit prompt builder', () => {
  const input = {
    companyName: 'Acme',
    industry: 'E-commerce',
    companyType: 'B2C Startup',
    companySize: '1-10',
    problems: ['No automation'],
    currentTools: ['Shopify'],
    budget: 'low' as const,
  };

  it('includes company name in prompt', () => {
    const prompt = buildAuditUserPrompt(input);
    expect(prompt).toContain('Acme');
  });

  it('includes all problems in prompt', () => {
    const prompt = buildAuditUserPrompt(input);
    expect(prompt).toContain('No automation');
  });

  it('includes tools in prompt', () => {
    const prompt = buildAuditUserPrompt(input);
    expect(prompt).toContain('Shopify');
  });

  it('handles empty currentTools gracefully', () => {
    const prompt = buildAuditUserPrompt({ ...input, currentTools: [] });
    expect(prompt).toContain('None specified');
  });

  it('system prompt instructs JSON-only response', () => {
    expect(AUDIT_SYSTEM_PROMPT).toContain('ONLY with a single valid JSON object');
  });
});

describe('AuditReportSchema validation', () => {
  const validReport = {
    executiveSummary: 'This company has significant opportunity in AI automation.',
    painPoints: [
      { title: 'Manual processes', description: 'Everything is done manually', severity: 'high' },
    ],
    recommendations: [
      {
        title: 'Implement CRM',
        description: 'Deploy HubSpot to centralise leads',
        priority: 1,
        estimatedImpact: '30% faster follow-ups',
      },
    ],
    aiOpportunities: [
      {
        area: 'Sales',
        solution: 'AI lead scoring',
        tools: ['HubSpot AI'],
        difficulty: 'easy',
      },
    ],
    estimatedROI: '25-40% efficiency gain within 6 months',
    implementationRoadmap: [
      {
        phase: 1,
        title: 'Foundation',
        duration: 'Weeks 1-4',
        tasks: ['Set up CRM', 'Import existing leads'],
      },
    ],
  };

  it('accepts a valid audit report', () => {
    const result = AuditReportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it('rejects invalid severity', () => {
    const result = AuditReportSchema.safeParse({
      ...validReport,
      painPoints: [{ ...validReport.painPoints[0], severity: 'critical' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid difficulty', () => {
    const result = AuditReportSchema.safeParse({
      ...validReport,
      aiOpportunities: [{ ...validReport.aiOpportunities[0], difficulty: 'very-hard' }],
    });
    expect(result.success).toBe(false);
  });
});
