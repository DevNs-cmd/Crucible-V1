export type ExecutionState = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ESCALATED';

export interface ExecutionIntent {
  id: string;
  task_name: string;
  state: ExecutionState;
  payload: Record<string, any>;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

/** * Strict transition matrix for Item 5 Execution State Machine.
 * This governs background tasks and engine processing states.
 */
export const VALID_EXECUTION_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  PENDING: ['IN_PROGRESS', 'ESCALATED'],
  IN_PROGRESS: ['COMPLETED', 'BLOCKED', 'FAILED','ESCALATED'],
  BLOCKED: ['IN_PROGRESS', 'ESCALATED', 'FAILED'],
  FAILED: ['ESCALATED'], 
  COMPLETED: [], // Terminal state
  ESCALATED: ['PENDING', 'FAILED'] // Escalated issues can be retried or marked as hard failures
};