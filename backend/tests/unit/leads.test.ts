import { CreateLeadSchema, UpdateLeadStatusSchema, LeadFilterSchema } from '../../src/utils/validators';
import { getPagination } from '../../src/utils/pagination';
import { Request } from 'express';

const validLead = { full_name: 'Jane Doe', email: 'jane@example.com', company: 'Acme' };

describe('CreateLeadSchema', () => {
  it('accepts minimal valid lead', () => {
    expect(CreateLeadSchema.safeParse(validLead).success).toBe(true);
  });
  it('defaults status to new', () => {
    const r = CreateLeadSchema.safeParse(validLead);
    expect(r.success && r.data.status).toBe('new');
  });
  it('rejects invalid email', () => {
    expect(CreateLeadSchema.safeParse({ ...validLead, email: 'bad' }).success).toBe(false);
  });
  it('rejects invalid status', () => {
    expect(CreateLeadSchema.safeParse({ ...validLead, status: 'unknown' }).success).toBe(false);
  });
  it('rejects negative value', () => {
    expect(CreateLeadSchema.safeParse({ ...validLead, value: -1 }).success).toBe(false);
  });
  it('rejects non-UUID assigned_to', () => {
    expect(CreateLeadSchema.safeParse({ ...validLead, assigned_to: 'not-uuid' }).success).toBe(false);
  });
  it('accepts valid UUID assigned_to', () => {
    expect(CreateLeadSchema.safeParse({ ...validLead, assigned_to: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }).success).toBe(true);
  });
});

describe('UpdateLeadStatusSchema', () => {
  const statuses = ['new', 'contacted', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  statuses.forEach((s) => {
    it(`accepts status: ${s}`, () => {
      expect(UpdateLeadStatusSchema.safeParse({ status: s }).success).toBe(true);
    });
  });
  it('rejects unknown status', () => {
    expect(UpdateLeadStatusSchema.safeParse({ status: 'archived' }).success).toBe(false);
  });
});

describe('LeadFilterSchema', () => {
  it('accepts empty filters', () => {
    expect(LeadFilterSchema.safeParse({}).success).toBe(true);
  });
  it('accepts valid status filter', () => {
    expect(LeadFilterSchema.safeParse({ status: 'contacted' }).success).toBe(true);
  });
  it('rejects invalid status filter', () => {
    expect(LeadFilterSchema.safeParse({ status: 'bad' }).success).toBe(false);
  });
});

describe('getPagination', () => {
  const req = (q: Record<string, string>) => ({ query: q } as unknown as Request);
  it('returns defaults', () => {
    const p = getPagination(req({}));
    expect(p).toEqual({ page: 1, limit: 20, offset: 0 });
  });
  it('calculates offset correctly', () => {
    const p = getPagination(req({ page: '3', limit: '10' }));
    expect(p).toEqual({ page: 3, limit: 10, offset: 20 });
  });
  it('caps limit at 100', () => {
    expect(getPagination(req({ limit: '999' })).limit).toBe(100);
  });
  it('floors page at 1', () => {
    expect(getPagination(req({ page: '-5' })).page).toBe(1);
  });
});
