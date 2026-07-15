import { Request, Response, NextFunction } from 'express';
import * as ExecutionService from '../automation/execution.service';
import { ExecutionState } from '../../models/execution.model';

/**
 * POST /api/executions
 * Body: { task_name: string, payload: object }
 */
export async function createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { task_name, payload } = req.body;
    if (!task_name) {
      res.status(400).json({ success: false, error: 'Missing required field: task_name' });
      return;
    }

    const intent = await ExecutionService.createExecutionIntent(task_name, payload ?? {});
    res.status(201).json({ success: true, data: intent, message: 'Execution intent initialized' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/executions/:id/state
 * Body: { state: ExecutionState, error_message?: string }
 */
export async function updateIntentState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { state, error_message } = req.body;

    if (!state) {
      res.status(400).json({ success: false, error: 'Missing required field: state' });
      return;
    }

    const updatedIntent = await ExecutionService.updateExecutionState(
      id!,
      state as ExecutionState,
      error_message
    );

    res.status(200).json({ success: true, data: updatedIntent, message: 'Execution state updated successfully' });
  } catch (err: any) {
    // Catch custom validation errors from our state machine utility
    if (err.status === 400) {
      res.status(400).json({
        success: false,
        error: 'Invalid Execution Transition',
        details: { message: err.message }
      });
      return;
    }
    next(err);
  }
}

/**
 * GET /api/executions/:id
 */
export async function getIntentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const intent = await ExecutionService.getExecutionIntentById(id!);
    res.status(200).json({ success: true, data: intent });
  } catch (err) {
    next(err);
  }
}