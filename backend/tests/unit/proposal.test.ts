import { GenerateProposalSchema, ProposalSchema } from '../../src/utils/validators';
import { buildProposalUserPrompt, PROPOSAL_SYSTEM_PROMPT } from '../../src/domains/ai/prompts/proposal.prompt';

const validInput = {
  companyName: 'Acme Corp',
  industry: 'E-commerce',
  servicesRequired: ['AI Automation', 'CRM Setup'],
  problems: 'Manual processes causing delays',
  budget: 'medium' as const,
};

describe('GenerateProposalSchema', () => {
  it('accepts valid input', () => { expect(GenerateProposalSchema.safeParse(validInput).success).toBe(true); });
  it('rejects empty companyName', () => { expect(GenerateProposalSchema.safeParse({ ...validInput, companyName: '' }).success).toBe(false); });
  it('rejects empty services array', () => { expect(GenerateProposalSchema.safeParse({ ...validInput, servicesRequired: [] }).success).toBe(false); });
  it('rejects invalid budget', () => { expect(GenerateProposalSchema.safeParse({ ...validInput, budget: 'extreme' }).success).toBe(false); });
  it('accepts optional contactEmail', () => {
    expect(GenerateProposalSchema.safeParse({ ...validInput, contactEmail: 'ceo@acme.com' }).success).toBe(true);
  });
  it('rejects invalid contactEmail', () => {
    expect(GenerateProposalSchema.safeParse({ ...validInput, contactEmail: 'not-email' }).success).toBe(false);
  });
});

describe('buildProposalUserPrompt', () => {
  it('includes company name', () => { expect(buildProposalUserPrompt(validInput)).toContain('Acme Corp'); });
  it('includes services', () => { expect(buildProposalUserPrompt(validInput)).toContain('AI Automation'); });
  it('includes problems', () => { expect(buildProposalUserPrompt(validInput)).toContain('Manual processes'); });
});

describe('PROPOSAL_SYSTEM_PROMPT', () => {
  it('instructs JSON-only response', () => { expect(PROPOSAL_SYSTEM_PROMPT).toContain('ONLY with a single valid JSON object'); });
  it('mentions AlgoForce AI', () => { expect(PROPOSAL_SYSTEM_PROMPT).toContain('AlgoForce AI'); });
});

const validProposal = {
  title: 'Proposal for Acme Corp',
  introduction: 'We are pleased to present...',
  problemStatement: 'Your team faces manual delays...',
  proposedSolution: 'We will implement AI automation...',
  servicesBreakdown: [{
    service: 'AI Automation',
    description: 'End-to-end automation',
    deliverables: ['Workflow setup', 'Testing'],
    timeline: '3-4 weeks',
  }],
  investmentSummary: 'Total investment: $5,000-$10,000',
  whyAlgoForce: 'We have 5 years experience...',
  nextSteps: ['Schedule discovery call', 'Sign contract'],
  termsAndConditions: 'Standard terms apply...',
};

describe('ProposalSchema', () => {
  it('accepts valid proposal', () => { expect(ProposalSchema.safeParse(validProposal).success).toBe(true); });
  it('rejects missing title', () => {
    const { title: _t, ...without } = validProposal;
    expect(ProposalSchema.safeParse(without).success).toBe(false);
  });
});
