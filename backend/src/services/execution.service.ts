import { ExecutionIntent, ExecutionState } from '../models/execution.model';
import { validateExecutionTransition } from '../utils/executionValidator';
import { eventBroker } from '../utils/eventBroker';

// 1. Notice the "export" keyword here to make it accessible to the interceptor
export const mockExecutionStore: ExecutionIntent[] = [];

/**
 * Initializes a brand new background task intent in the PENDING state.
 */
export async function createExecutionIntent(taskName: string, payload: Record<string, any>): Promise<ExecutionIntent> {
  const newIntent: ExecutionIntent = {
    id: `intent-id-${Date.now()}`,
    task_name: taskName,
    state: 'PENDING',
    payload,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockExecutionStore.push(newIntent);
  console.log(`[Execution Engine] Created intent ${newIntent.id} (${taskName}) -> PENDING`);
  return newIntent;
}

/**
 * Safely advances an execution intent's status using our state machine guard rules.
 */
export async function updateExecutionState(
  id: string,
  nextState: ExecutionState,
  errorMessage?: string | null
): Promise<ExecutionIntent> {
  const intent = mockExecutionStore.find((i) => i.id === id);
  if (!intent) {
    throw Object.assign(new Error('Execution Intent not found'), { status: 404 });
  }

  const validation = validateExecutionTransition(intent.state, nextState);
  if (!validation.isValid) {
    throw Object.assign(new Error(validation.message), { status: 400 });
  }

  // Capture the old state before mutating it
  const oldState = intent.state;

  intent.state = nextState;
  intent.error_message = errorMessage ?? null;
  intent.updated_at = new Date().toISOString();

  console.log(`[Execution Engine] Transitioned ${id} to -> ${nextState}`);

  // 📢 Publish the Event asynchronously to the architecture stream
  // We don't 'await' it so it fires in the background without blocking the HTTP response thread
  eventBroker.publish('lead.updated', {
    leadId: id,
    oldState: oldState,
    newState: nextState,
    context: 'Execution State Machine'
  }).catch((err) => console.error('[Event Broker Trigger Error]:', err));

  return intent;
}

/**
 * Retrieves a single execution intent by ID.
 */
export async function getExecutionIntentById(id: string): Promise<ExecutionIntent> {
  const intent = mockExecutionStore.find((i) => i.id === id);
  if (!intent) {
    throw Object.assign(new Error('Execution Intent not found'), { status: 404 });
  }
  return intent;
}