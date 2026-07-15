import { Router } from 'express';
import * as ExecutionController from '../automation/execution.controller';
import { interceptWorkflowStateChange } from './workflowInterceptor';

const router = Router();

// Base endpoint context: /api/executions
router.post('/', ExecutionController.createIntent);
router.get('/:id', ExecutionController.getIntentById);

// The interceptor runs BEFORE the controller to evaluate security and lifecycle rules
router.patch('/:id/state', interceptWorkflowStateChange, ExecutionController.updateIntentState);

export default router;