import { Router } from 'express';
import * as FollowUpsController from './followups.controller';
import { authenticate } from '../../middleware/auth';
import { crmLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });
router.use(authenticate);
router.use(crmLimiter);

router.get('/', FollowUpsController.getFollowUps);
router.post('/', FollowUpsController.createFollowUp);
router.patch('/:fid', FollowUpsController.completeFollowUp);

export default router;
