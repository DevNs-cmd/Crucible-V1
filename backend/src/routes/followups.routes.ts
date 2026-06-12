import { Router } from 'express';
import * as FollowUpsController from '../controllers/followups.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', FollowUpsController.getFollowUps);
router.post('/', FollowUpsController.createFollowUp);
router.patch('/:fid', FollowUpsController.completeFollowUp);

export default router;
