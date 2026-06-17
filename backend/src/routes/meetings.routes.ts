import { Router } from 'express';
import * as MeetingsController from '../controllers/meetings.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', MeetingsController.getMeetings);
router.post('/', MeetingsController.createMeeting);

export default router;
