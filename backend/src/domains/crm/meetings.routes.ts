import { Router } from 'express';
import * as MeetingsController from './meetings.controller';
import { authenticate } from '../../middleware/auth';
import { crmLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });
router.use(authenticate);
router.use(crmLimiter);

router.get('/', MeetingsController.getMeetings);
router.post('/', MeetingsController.createMeeting);

export default router;
