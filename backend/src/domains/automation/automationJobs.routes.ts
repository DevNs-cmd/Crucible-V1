import { Router } from 'express';
import * as AutomationJobsController from './automationJobs.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

/** GET /api/automation/jobs — paginated list, behind authenticate. */
router.get('/', authenticate, AutomationJobsController.listAutomationJobs);

/** GET /api/automation/jobs/:id — single job detail, behind authenticate. */
router.get('/:id', authenticate, AutomationJobsController.getAutomationJob);

/** POST /api/automation/jobs/:id/replay — admin-only replay of failed/dead_letter jobs. */
router.post('/:id/replay', authenticate, requireRole('admin'), AutomationJobsController.replayAutomationJob);

export default router;
