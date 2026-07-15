import { Router } from 'express';
import * as ActivityLogController from './activityLog.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', ActivityLogController.getActivityLogs);

export default router;
