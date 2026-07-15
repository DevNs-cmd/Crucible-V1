import { Request, Response, NextFunction } from 'express';
import { mockExecutionStore } from '../automation/execution.service';

/**
 * Workflow Interception Layer
 * Intercepts requests attempting to mutate execution states and blocks invalid operations.
 */
export const interceptWorkflowStateChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { state: targetState } = req.body;

  // Locate the intent directly from the exported array
  const currentIntent = mockExecutionStore.find((i) => i.id === id);

  if (!currentIntent) {
    res.status(404).json({
      success: false,
      error: "Execution Intent Not Found",
      details: { message: `Cannot intercept workflow. No intent found with ID: ${id}` }
    });
    return;
  }

  // Business Rule: Block modifications to historical terminal states
  if (currentIntent.state === 'COMPLETED' || currentIntent.state === 'FAILED') {
    res.status(400).json({
      success: false,
      error: "Workflow Interception Blocked Operation",
      details: {
        message: `Security Lock: Mutation rejected. This execution is already in a terminal state ('${currentIntent.state}') and cannot be updated to '${targetState}'.`
      }
    });
    return;
  }

  next();
};