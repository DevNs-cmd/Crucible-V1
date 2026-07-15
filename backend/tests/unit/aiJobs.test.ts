import { enqueueAIJob, aiJobsQueue } from '../../src/domains/automation/queues/aiJobs.queue';
import { getJobStatus } from '../../src/domains/automation/jobs.controller';
import { supabase } from '../../src/config/database';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../src/utils/response';

// Mock database
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock BullMQ
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'bullmq-job-id' }),
    })),
  };
});

// Mock response helpers
jest.mock('../../src/utils/response', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn(),
}));

describe('enqueueAIJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inserts into database and enqueues job to BullMQ queue', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    const input = { companyName: 'TestCo', industry: 'SaaS' };
    const requestedBy = 'user-123';

    const result = await enqueueAIJob('audit', input, requestedBy);

    expect(result.jobId).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith('ai_jobs');
    expect(mockInsert).toHaveBeenCalledWith({
      id: result.jobId,
      job_type: 'audit',
      status: 'queued',
      input,
      requested_by: requestedBy,
    });

    // Verify it added to queue
    const addSpy = (aiJobsQueue as any).add;
    expect(addSpy).toHaveBeenCalledWith(
      'audit',
      { jobId: result.jobId, input, requestedBy },
      expect.objectContaining({
        jobId: result.jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      })
    );
  });
});

describe('getJobStatus Authorization Check', () => {
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows owner to retrieve job status', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'job-1', requested_by: 'owner-id', status: 'completed', result: { ok: true } },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = {
      params: { id: 'job-1' },
      user: { userId: 'owner-id', role: 'member' },
    } as unknown as Request;

    await getJobStatus(req, mockRes as Response, mockNext);

    expect(sendSuccess).toHaveBeenCalledWith(mockRes, expect.objectContaining({ id: 'job-1' }), expect.any(String));
    expect(sendError).not.toHaveBeenCalled();
  });

  it('allows admin to retrieve any job status', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'job-1', requested_by: 'owner-id', status: 'completed' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = {
      params: { id: 'job-1' },
      user: { userId: 'admin-id', role: 'admin' },
    } as unknown as Request;

    await getJobStatus(req, mockRes as Response, mockNext);

    expect(sendSuccess).toHaveBeenCalledWith(mockRes, expect.objectContaining({ id: 'job-1' }), expect.any(String));
    expect(sendError).not.toHaveBeenCalled();
  });

  it('denies non-owner non-admin access (returns 403)', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'job-1', requested_by: 'owner-id', status: 'completed' },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = {
      params: { id: 'job-1' },
      user: { userId: 'other-user-id', role: 'member' },
    } as unknown as Request;

    await getJobStatus(req, mockRes as Response, mockNext);

    expect(sendError).toHaveBeenCalledWith(mockRes, expect.stringContaining('Forbidden'), 403);
    expect(sendSuccess).not.toHaveBeenCalled();
  });

  it('returns 404 if job does not exist', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = {
      params: { id: 'non-existent' },
      user: { userId: 'owner-id', role: 'member' },
    } as unknown as Request;

    await getJobStatus(req, mockRes as Response, mockNext);

    expect(sendError).toHaveBeenCalledWith(mockRes, 'Job not found', 404);
    expect(sendSuccess).not.toHaveBeenCalled();
  });
});
