const mockGetClientIp = jest.fn();
const mockHashIdentifier = jest.fn();
const mockIncrementWindowCounter = jest.fn();
const mockRecordAbuseLog = jest.fn();

jest.mock('../../src/domains/security/security.service', () => ({
  getClientIp: mockGetClientIp,
  hashIdentifier: mockHashIdentifier,
  incrementWindowCounter: mockIncrementWindowCounter,
  recordAbuseLog: mockRecordAbuseLog,
}));

import { Request, Response } from 'express';
import { createSecurityRateLimiter } from '../../src/middleware/rateLimiter';

describe('createSecurityRateLimiter', () => {
  beforeEach(() => {
    mockGetClientIp.mockReset();
    mockHashIdentifier.mockReset();
    mockIncrementWindowCounter.mockReset();
    mockRecordAbuseLog.mockReset();

    mockGetClientIp.mockReturnValue('10.0.0.1');
    mockHashIdentifier.mockImplementation((value: string) => `hash:${value}`);
    mockRecordAbuseLog.mockResolvedValue(undefined);
  });

  it('returns 429 and records abuse when a scoped limit is exceeded', async () => {
    mockIncrementWindowCounter.mockResolvedValue({
      count: 101,
      ttlSeconds: 60,
      resetAt: new Date(Date.now() + 60_000),
    });

    const limiter = createSecurityRateLimiter({
      name: 'crm',
      max: 100,
      windowMs: 60_000,
      includeOrganization: true,
      includeUser: true,
      message: 'CRM request limit reached. Try again later.',
    });

    const req = {
      user: {
        userId: 'user-1',
        organizationId: 'org-1',
      },
      method: 'GET',
      originalUrl: '/api/leads',
      headers: {},
      body: {},
      get: jest.fn().mockReturnValue('jest'),
      ip: '10.0.0.1',
      socket: {},
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    await limiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'CRM request limit reached. Try again later.',
    });
    expect(mockRecordAbuseLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      organizationId: 'org-1',
      reason: 'rate_limit_exceeded',
      metadata: expect.objectContaining({
        limiter: 'crm',
        limit: 100,
        window_ms: 60_000,
      }),
    }));
  });
});
