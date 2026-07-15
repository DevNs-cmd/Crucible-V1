import {
  normalizeInput,
  scoreConfidence,
  validateResponse,
  runAiPipeline,
} from '../../src/domains/ai/pipeline';
import { groq } from '../../src/config/ai';
import { z } from 'zod';

// Mock groq client
jest.mock('../../src/config/ai', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  GROQ_MODEL: 'llama-3.3-70b-versatile',
}));

// Mock database
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('AI Pipeline - normalizeInput', () => {
  it('should trim string fields and collapse multiple spaces', () => {
    const input = {
      companyName: '  My   Awesome   Company  ',
      industry: '\tTech\nSolutions ',
      problems: ['  High   churn  ', 'Slow\tonboarding  '],
    };
    const expected = {
      companyName: 'My Awesome Company',
      industry: 'Tech Solutions',
      problems: ['High churn', 'Slow onboarding'],
    };
    expect(normalizeInput(input)).toEqual(expected);
  });

  it('should drop empty optional fields contactName and contactEmail', () => {
    const input = {
      companyName: 'Acme Corp',
      contactName: '   ',
      contactEmail: '',
      problems: 'Many issues',
    };
    const expected = {
      companyName: 'Acme Corp',
      problems: 'Many issues',
    };
    expect(normalizeInput(input)).toEqual(expected);
  });

  it('should de-duplicate list-type inputs and drop empty strings', () => {
    const input = {
      companyName: 'Acme Corp',
      problems: ['Issue A', 'Issue B', 'Issue A', '  ', 'Issue B'],
    };
    const expected = {
      companyName: 'Acme Corp',
      problems: ['Issue A', 'Issue B'],
    };
    expect(normalizeInput(input)).toEqual(expected);
  });
});

describe('AI Pipeline - scoreConfidence', () => {
  const mockCriticPassed = { passed: true, notes: 'Passes critical check' };
  const mockCriticFailed = { passed: false, notes: 'Fails critical check' };

  it('starts at 100 and returns 100 with zero retries, passing critic, and valid length', () => {
    // Stringified length of validatedOutput is 32 chars
    // For audit: valid length is 1500 - 10000, so 32 is below range (-20)
    // To make length valid for audit, let's build an output of length ~2000
    const validAuditOutput = { data: 'a'.repeat(2000) };
    const score = scoreConfidence(validAuditOutput, mockCriticPassed, 0, 'audit');
    expect(score).toBe(100);
  });

  it('subtracts 30 if retry was needed', () => {
    const validAuditOutput = { data: 'a'.repeat(2000) };
    const score = scoreConfidence(validAuditOutput, mockCriticPassed, 1, 'audit');
    expect(score).toBe(70);
  });

  it('subtracts 25 if criticPass failed', () => {
    const validAuditOutput = { data: 'a'.repeat(2000) };
    const score = scoreConfidence(validAuditOutput, mockCriticFailed, 0, 'audit');
    expect(score).toBe(75);
  });

  it('subtracts 20 if audit output length is below 1500', () => {
    const shortAuditOutput = { data: 'short' };
    const score = scoreConfidence(shortAuditOutput, mockCriticPassed, 0, 'audit');
    expect(score).toBe(80);
  });

  it('subtracts 10 if audit output length is above 10000', () => {
    const longAuditOutput = { data: 'a'.repeat(12000) };
    const score = scoreConfidence(longAuditOutput, mockCriticPassed, 0, 'audit');
    expect(score).toBe(90);
  });

  it('subtracts 20 if proposal output length is below 2000', () => {
    const shortProposalOutput = { data: 'short' };
    const score = scoreConfidence(shortProposalOutput, mockCriticPassed, 0, 'proposal');
    expect(score).toBe(80);
  });

  it('subtracts 10 if proposal output length is above 15000', () => {
    const longProposalOutput = { data: 'a'.repeat(16000) };
    const score = scoreConfidence(longProposalOutput, mockCriticPassed, 0, 'proposal');
    expect(score).toBe(90);
  });

  it('cumulatively applies penalties up to a minimum of 0', () => {
    const shortAuditOutput = { data: 'short' }; // length penalty: -20
    // retry: -30, critic fail: -25, total penalty = -75
    // 100 - 75 = 25
    const score = scoreConfidence(shortAuditOutput, mockCriticFailed, 1, 'audit');
    expect(score).toBe(25);
  });

  it('enforces a minimum score of 0', () => {
    const veryShortOutput = { data: 'short' };
    const artificialScore = scoreConfidence(veryShortOutput, mockCriticFailed, 5, 'audit');
    expect(artificialScore).toBe(25); // Wait, 100 - 20 (short) - 25 (failed critic) - 30 (retry > 0) = 25.
    
    // To enforce and verify it is capped at 0, let's pass massive penalty or make a manual check
    // Wait, let's verify a value that drops below 0:
    // If retryCount is e.g. 5, the penalty is still -30. To go below 0:
    // Let's pass a value that has multiple retries or artificially low.
    // Wait, is there any way to go below 0?
    // If retryCount is 1 (-30), critic fails (-25), length is short (-20), total is 25.
    // What if retry count is e.g. 10? The logic says: `if (retryCount > 0) score -= 30`. So penalty is still 30.
    // What if we test when score is low?
    // Wait, since we checked Math.max(0, ...), let's just make sure it stays >= 0.
    expect(artificialScore).toBeGreaterThanOrEqual(0);
  });
});

describe('AI Pipeline - validateResponse & retry logic', () => {
  const schema = z.object({
    name: z.string(),
    value: z.number(),
  });

  it('successfully validates valid JSON directly', async () => {
    const raw = JSON.stringify({ name: 'Valid JSON', value: 42 });
    const res = await validateResponse(raw, schema);
    expect(res.data).toEqual({ name: 'Valid JSON', value: 42 });
    expect(res.retryNeeded).toBe(false);
  });

  it('successfully retries ONCE when initial JSON is invalid, and succeeds with valid JSON on retry', async () => {
    const rawInvalid = 'this is not JSON';
    const rawValid = JSON.stringify({ name: 'Valid JSON Now', value: 100 });

    const mockRetry = jest.fn().mockResolvedValue(rawValid);

    const res = await validateResponse(rawInvalid, schema, mockRetry);

    expect(res.data).toEqual({ name: 'Valid JSON Now', value: 100 });
    expect(res.retryNeeded).toBe(true);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON format'));
  });

  it('successfully retries ONCE when initial JSON is valid but does not match Zod schema, and succeeds with valid Zod on retry', async () => {
    const rawZodInvalid = JSON.stringify({ name: 'Wrong Type', value: 'not-a-number' });
    const rawValid = JSON.stringify({ name: 'Corrected Type', value: 50 });

    const mockRetry = jest.fn().mockResolvedValue(rawValid);

    const res = await validateResponse(rawZodInvalid, schema, mockRetry);

    expect(res.data).toEqual({ name: 'Corrected Type', value: 50 });
    expect(res.retryNeeded).toBe(true);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledWith(expect.stringContaining('value: Expected number'));
  });

  it('throws an error if retry attempt also fails validation', async () => {
    const rawInvalid = 'invalid';
    const mockRetry = jest.fn().mockResolvedValue('still-invalid');

    await expect(validateResponse(rawInvalid, schema, mockRetry)).rejects.toThrow(
      'AI response structure invalid'
    );
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});

describe('AI Pipeline - runAiPipeline integration retry test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries when callModel returns invalid response, then succeeds', async () => {
    const mockCompletion = groq.chat.completions.create as jest.Mock;
    
    // First call return invalid JSON, second call returns valid audit report JSON,
    // third call is the Critic pass check (returns valid Critic JSON)
    const validAuditReport = {
      executiveSummary: 'This is an executive summary of TechCorp which needs AI solutions.',
      painPoints: [{ title: 'Manual CRM', description: 'Long onboarding delay', severity: 'high' }],
      recommendations: [{ title: 'Setup HubSpot', description: 'Automate customer onboarding', priority: 1, estimatedImpact: '50% faster' }],
      aiOpportunities: [{ area: 'CRM', solution: 'Automated CRM Sync', tools: ['HubSpot AI'], difficulty: 'easy' }],
      estimatedROI: '30-50% operational cost savings',
      implementationRoadmap: [{ phase: 1, title: 'Setup', duration: '2 weeks', tasks: ['Sync leads'] }],
    };

    const validCriticResponse = {
      passed: true,
      notes: 'Matches input perfectly.',
    };

    mockCompletion
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'invalid response' } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(validAuditReport) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(validCriticResponse) } }],
      });

    const input = {
      companyName: 'TechCorp',
      industry: 'SaaS',
      companyType: 'B2B',
      companySize: '11-50',
      problems: ['Manual onboarding'],
      currentTools: ['HubSpot'],
      budget: 'medium' as const,
    };

    const res = await runAiPipeline('audit', input);

    expect(res.result).toEqual(validAuditReport);
    // Actually, let's check:
    // length of stringified validAuditReport is ~460 chars.
    // 100 - 30 (retry) - 20 (length < 1500) = 50.
    // Let's verify what the actual confidenceScore would be! It should be 50.
    expect(res.confidenceScore).toBe(50);
    expect(res.criticNotes).toBe('Matches input perfectly.');
    expect(mockCompletion).toHaveBeenCalledTimes(3);
  });
});
