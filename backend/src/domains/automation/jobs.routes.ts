import { Router } from 'express';
import * as JobsController from './jobs.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/:id', authenticate, JobsController.getJobStatus);

export default router;
