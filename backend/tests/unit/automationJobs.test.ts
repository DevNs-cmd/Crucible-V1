import { getWorkflowVersion, WORKFLOW_REGISTRY, WorkflowKey } from '../../src/domains/automation/workflowRegistry';
import { enqueueAutomationJob, automationJobsQueue } from '../../src/domains/automation/queues/automationJobs.queue';
import { replayAutomationJob } from '../../src/domains/automation/automationJobs.controller';
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
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

// Mock response helpers
jest.mock('../../src/utils/response', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn(),
}));

// ─── Workflow Registry Tests ─────────────────────────────────────────────────

describe('workflowRegistry', () => {
  it('returns correct version for n8n.new_lead', () => {
    expect(getWorkflowVersion('n8n.new_lead')).toBe(1);
  });

  it('returns correct version for n8n.status_change', () => {
    expect(getWorkflowVersion('n8n.status_change')).toBe(1);
  });

  it('returns correct version for n8n.followup_reminder', () => {
    expect(getWorkflowVersion('n8n.followup_reminder')).toBe(1);
  });

  it('contains all expected workflow keys', () => {
    const keys = Object.keys(WORKFLOW_REGISTRY);
    expect(keys).toContain('n8n.new_lead');
    expect(keys).toContain('n8n.status_change');
    expect(keys).toContain('n8n.followup_reminder');
    expect(keys).toHaveLength(3);
  });

  it('each entry has a version and description', () => {
    for (const key of Object.keys(WORKFLOW_REGISTRY) as WorkflowKey[]) {
      const entry = WORKFLOW_REGISTRY[key];
      expect(typeof entry.version).toBe('number');
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});

// ─── enqueueAutomationJob Tests ──────────────────────────────────────────────

describe('enqueueAutomationJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inserts into database and enqueues job to BullMQ queue', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    const payload = { leadId: 'lead-1', leadName: 'Test Lead' };
    const triggeredByEvent = 'lead.created';

    const result = await enqueueAutomationJob('n8n.new_lead', payload, triggeredByEvent);

    expect(result.jobId).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith('automation_jobs');
    expect(mockInsert).toHaveBeenCalledWith({
      id: result.jobId,
      workflow_key: 'n8n.new_lead',
      workflow_version: 1,
      status: 'queued',
      payload,
      triggered_by_event: triggeredByEvent,
    });

    // Verify it added to queue
    const addSpy = (automationJobsQueue as any).add;
    expect(addSpy).toHaveBeenCalledWith(
      'n8n.new_lead',
      {
        jobId: result.jobId,
        workflowKey: 'n8n.new_lead',
        workflowVersion: 1,
        payload,
        triggeredByEvent,
      },
      expect.objectContaining({
        jobId: result.jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      })
    );
  });

  it('throws 500 if database insert fails', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'DB error' } });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      enqueueAutomationJob('n8n.new_lead', { leadId: 'x' }, 'lead.created')
    ).rejects.toThrow('Failed to initialize automation job state');
  });

  it('sets triggered_by_event to null when not provided', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await enqueueAutomationJob('n8n.status_change', { leadId: 'x' });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        triggered_by_event: null,
      })
    );
  });
});

// ─── Replay Endpoint Tests ──────────────────────────────────────────────────

describe('replayAutomationJob', () => {
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
      user: { userId: 'admin-id', role: 'admin' },
    } as unknown as Request;

    await replayAutomationJob(req, mockRes as Response, mockNext);

    expect(sendError).toHaveBeenCalledWith(mockRes, 'Automation job not found', 404);
    expect(sendSuccess).not.toHaveBeenCalled();
  });

  it('returns 400 if job is not in a replayable status', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'job-1', status: 'completed', workflow_key: 'n8n.new_lead', payload: {} },
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

    await replayAutomationJob(req, mockRes as Response, mockNext);

    expect(sendError).toHaveBeenCalledWith(
      mockRes,
      expect.stringContaining("Cannot replay a job with status 'completed'"),
      400
    );
    expect(sendSuccess).not.toHaveBeenCalled();
  });

  it('replays a dead_letter job successfully and returns 201', async () => {
    // First call: fetch the dead_letter job
    const mockSingleFetch = jest.fn().mockResolvedValue({
      data: {
        id: 'job-dead',
        status: 'dead_letter',
        workflow_key: 'n8n.new_lead',
        payload: { leadId: 'lead-1' },
        triggered_by_event: 'lead.created',
      },
      error: null,
    });
    const mockSelectFetch = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingleFetch,
      }),
    });

    // Second call: insert new automation job (from enqueueAutomationJob)
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        // First call: select from automation_jobs
        return { select: mockSelectFetch };
      }
      // Second call: insert into automation_jobs
      return { insert: mockInsert };
    });

    const req = {
      params: { id: 'job-dead' },
      user: { userId: 'admin-id', role: 'admin' },
    } as unknown as Request;

    await replayAutomationJob(req, mockRes as Response, mockNext);

    expect(sendSuccess).toHaveBeenCalledWith(
      mockRes,
      expect.objectContaining({
        originalJobId: 'job-dead',
        replayedJobId: expect.any(String),
      }),
      'Automation job replayed',
      201
    );
  });

  it('replays a failed job successfully', async () => {
    const mockSingleFetch = jest.fn().mockResolvedValue({
      data: {
        id: 'job-failed',
        status: 'failed',
        workflow_key: 'n8n.status_change',
        payload: { leadId: 'lead-2', oldStatus: 'new', newStatus: 'contacted' },
        triggered_by_event: 'lead.updated',
      },
      error: null,
    });
    const mockSelectFetch = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingleFetch,
      }),
    });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectFetch };
      }
      return { insert: mockInsert };
    });

    const req = {
      params: { id: 'job-failed' },
      user: { userId: 'admin-id', role: 'admin' },
    } as unknown as Request;

    await replayAutomationJob(req, mockRes as Response, mockNext);

    expect(sendSuccess).toHaveBeenCalledWith(
      mockRes,
      expect.objectContaining({
        originalJobId: 'job-failed',
        replayedJobId: expect.any(String),
      }),
      'Automation job replayed',
      201
    );
  });
});
