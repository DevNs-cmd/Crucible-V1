import { Router } from 'express';
import * as ExecutionController from '../controllers/execution.controller';

const router = Router();

// Base endpoint context: /api/executions
router.post('/', ExecutionController.createIntent);
router.get('/:id', ExecutionController.getIntentById);
router.patch('/:id/state', ExecutionController.updateIntentState);

export default router;