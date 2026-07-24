const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockSingle = jest.fn();
const mockRecordActivity = jest.fn();

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      single: mockSingle,
    })),
  },
}));

jest.mock('../../src/domains/activity-log/activityLog.service', () => ({
  recordActivity: mockRecordActivity,
}));

import {
  hashRefreshToken,
  issueRefreshToken,
  rotateRefreshToken,
} from '../../src/domains/security/security.service';

const userId = '11111111-1111-4111-8111-111111111111';
const subject = {
  userId,
  email: 'security@example.com',
  role: 'member',
  organizationId: null,
};
const context = {
  ipAddress: '127.0.0.1',
  endpoint: 'POST /api/auth/refresh',
  userAgent: 'jest',
};

function resetQueryMocks(): void {
  mockInsert.mockReset();
  mockUpdate.mockReset();
  mockSelect.mockReset();
  mockEq.mockReset();
  mockIs.mockReset();
  mockSingle.mockReset();
  mockRecordActivity.mockReset();

  mockInsert.mockResolvedValue({ error: null });
  mockUpdate.mockReturnThis();
  mockSelect.mockReturnThis();
  mockEq.mockReturnThis();
  mockIs.mockReturnThis();
  mockRecordActivity.mockResolvedValue(undefined);
}

describe('security refresh token rotation', () => {
  beforeEach(() => {
    resetQueryMocks();
  });

  it('stores only hashed refresh tokens when issuing a session token', async () => {
    const refreshToken = await issueRefreshToken(subject, context);
    const inserted = mockInsert.mock.calls[0]![0];

    expect(inserted.token_hash).toBe(hashRefreshToken(refreshToken));
    expect(inserted.token_hash).not.toContain(refreshToken);
    expect(inserted.user_id).toBe(userId);
    expect(inserted.session_id).toBeTruthy();
    expect(inserted.token_family_id).toBeTruthy();
  });

  it('invalidates the old refresh token and persists the replacement token hash', async () => {
    const refreshToken = await issueRefreshToken(subject, context);
    const originalRecord = {
      id: '22222222-2222-4222-8222-222222222222',
      ...mockInsert.mock.calls[0]![0],
      replaced_by_token_hash: null,
      revoked_at: null,
    };

    mockSingle
      .mockResolvedValueOnce({ data: originalRecord, error: null })
      .mockResolvedValueOnce({ data: originalRecord, error: null });

    const rotated = await rotateRefreshToken(refreshToken, context);
    const updatePayload = mockUpdate.mock.calls[0]![0];
    const replacementInsert = mockInsert.mock.calls[1]![0];

    expect(rotated.refreshToken).not.toBe(refreshToken);
    expect(updatePayload.revoked_at).toBeTruthy();
    expect(updatePayload.revocation_reason).toBe('rotated');
    expect(updatePayload.replaced_by_token_hash).toBe(hashRefreshToken(rotated.refreshToken));
    expect(replacementInsert.token_hash).toBe(hashRefreshToken(rotated.refreshToken));
    expect(replacementInsert.token_hash).not.toBe(originalRecord.token_hash);
  });

  it('logs abuse and revokes the session when a rotated token is replayed', async () => {
    const refreshToken = await issueRefreshToken(subject, context);
    const revokedRecord = {
      id: '33333333-3333-4333-8333-333333333333',
      ...mockInsert.mock.calls[0]![0],
      replaced_by_token_hash: 'replacement-hash',
      revoked_at: new Date().toISOString(),
    };

    mockSingle.mockResolvedValueOnce({ data: revokedRecord, error: null });

    await expect(rotateRefreshToken(refreshToken, context)).rejects.toMatchObject({ status: 401 });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      revocation_reason: 'refresh_token_replay',
    }));
    expect(mockRecordActivity).toHaveBeenCalledWith(expect.objectContaining({
      entity_type: 'security',
      action: 'security_alert',
      metadata: expect.objectContaining({
        reason: 'refresh_token_replay',
        severity: 'critical',
      }),
    }));
  });
});
