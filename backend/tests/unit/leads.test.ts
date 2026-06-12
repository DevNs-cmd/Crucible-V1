import {
  CreateLeadSchema,
  UpdateLeadStatusSchema,
  LeadFilterSchema,
} from '../../src/utils/validators';
import { getPagination } from '../../src/utils/pagination';
import { Request } from 'express';

describe('Leads — CreateLeadSchema validation', () => {
  const validLead = {
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Corp',
  };

  it('accepts a minimal valid lead', () => {
    const result = CreateLeadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it('defaults status to "new"', () => {
    const result = CreateLeadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('new');
    }
  });

  it('rejects invalid email', () => {
    const result = CreateLeadSchema.safeParse({ ...validLead, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = CreateLeadSchema.safeParse({ ...validLead, status: 'unknown_status' });
    expect(result.success).toBe(false);
  });

  it('rejects negative value', () => {
    const result = CreateLeadSchema.safeParse({ ...validLead, value: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts valid assigned_to UUID', () => {
    const result = CreateLeadSchema.safeParse({
      ...validLead,
      assigned_to: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID assigned_to', () => {
    const result = CreateLeadSchema.safeParse({ ...validLead, assigned_to: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('Leads — UpdateLeadStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const statuses = ['new', 'contacted', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    statuses.forEach((status) => {
      const result = UpdateLeadStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it('rejects an unknown status', () => {
    const result = UpdateLeadStatusSchema.safeParse({ status: 'archived' });
    expect(result.success).toBe(false);
  });
});

describe('Leads — LeadFilterSchema', () => {
  it('accepts empty filters', () => {
    const result = LeadFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid status filter', () => {
    const result = LeadFilterSchema.safeParse({ status: 'contacted' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status filter', () => {
    const result = LeadFilterSchema.safeParse({ status: 'bad_status' });
    expect(result.success).toBe(false);
  });
});

describe('Pagination helper', () => {
  const mockReq = (query: Record<string, string>) =>
    ({ query } as unknown as Request);

  it('returns defaults when no query params', () => {
    const p = getPagination(mockReq({}));
    expect(p.page).toBe(1);
    expect(p.limit).toBe(20);
    expect(p.offset).toBe(0);
  });

  it('calculates offset correctly', () => {
    const p = getPagination(mockReq({ page: '3', limit: '10' }));
    expect(p.page).toBe(3);
    expect(p.limit).toBe(10);
    expect(p.offset).toBe(20);
  });

  it('caps limit at 100', () => {
    const p = getPagination(mockReq({ limit: '999' }));
    expect(p.limit).toBe(100);
  });

  it('floors page at 1', () => {
    const p = getPagination(mockReq({ page: '-5' }));
    expect(p.page).toBe(1);
  });
});
