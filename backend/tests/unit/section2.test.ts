import { createExecutionIntent, mockExecutionStore } from '../../src/domains/automation/execution.service';


// Mock response/request objects to simulate our Express middleware/interceptor
import { Request, Response } from 'express';
import { interceptWorkflowStateChange } from '../../src/domains/automation/workflowInterceptor';

describe('Section 2: Core Execution System Verification', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    // Clear mock store before each test
    mockExecutionStore.length = 0;
    nextFunction = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // 🧪 TEST 1: Proof-of-Execution Enforcement
  describe('Proof-of-Execution Requirement', () => {
    it('should block moving to COMPLETED if proof is missing', async () => {
      const intent = await createExecutionIntent('Test Task', {});
      
      mockReq = {
        params: { id: intent.id },
        body: { state: 'COMPLETED' }, // No proof payload provided
      };

      await interceptWorkflowStateChange(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Workflow Interception Blocked Operation",
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow moving to COMPLETED if complete proof is provided', async () => {
      const intent = await createExecutionIntent('Test Task', {});
      
      mockReq = {
        params: { id: intent.id },
        body: { 
          state: 'COMPLETED',
          proof: {
            log: 'Task completed successfully without errors.',
            fileUrl: 'https://storage.googleapis.com/proofs/test-task.pdf',
            timestamp: new Date().toISOString()
          }
        },
      };

      await interceptWorkflowStateChange(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
 // 🧪 TEST 2: SLA Watchdog Engine
  describe('SLA Watchdog Engine', () => {
    it('should escalate an intent that stays in PENDING past the threshold', async () => {
      // Create an intent
      const intent = await createExecutionIntent('Slow Task', {});
      
      // Artificially manipulate the updated_at timestamp to simulate it being 2 hours old
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      intent.updated_at = twoHoursAgo;

      // Import the active watchdog runner logic to evaluate state without relying on setInterval delays
      const { runSlaWatchdog } = require('../../src/domains/automation/slaEngine');

      // Temporarily mock setInterval so we can run the watchdog execution pass synchronously
      const originalSetInterval = global.setInterval;
      let watchdogCallback: (() => void) | null = null;
      
      global.setInterval = jest.fn().mockImplementation((cb) => {
        watchdogCallback = cb;
        return 123 as any; // mock timer ID
      });

      // Register the watchdog to grab its execution callback
      runSlaWatchdog();

      expect(watchdogCallback).toBeDefined();

      if (watchdogCallback) {
        // Execute the SLA check synchronously
        await (watchdogCallback as () => Promise<void>)();
      }

      // Restore setInterval
      global.setInterval = originalSetInterval;

      // Verify state was successfully updated to ESCALATED
      expect(intent.state).toBe('ESCALATED');
      expect(intent.error_message).toContain('SLA breach');
    });
  });
});