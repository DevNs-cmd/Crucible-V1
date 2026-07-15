import { ExecutionState, VALID_EXECUTION_TRANSITIONS } from '../../models/execution.model';

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates whether an Execution Intent can move from its current state to a target state.
 * Implements the Core Execution System ruleset (Item 5).
 */
export function validateExecutionTransition(
  currentState: ExecutionState,
  nextState: ExecutionState
): ValidationResult {
  // If the state isn't changing at all, it's an idling operation (allowed)
  if (currentState === nextState) {
    return { isValid: true };
  }

  const allowedTransitions = VALID_EXECUTION_TRANSITIONS[currentState];

  // Check if the target state exists in our permitted transition array
  if (!allowedTransitions || !allowedTransitions.includes(nextState)) {
    return {
      isValid: false,
      message: `Execution State Machine error: Cannot transition task directly from '${currentState}' to '${nextState}'.`,
    };
  }

  return { isValid: true };
}