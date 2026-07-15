import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as IntelligenceController from './intelligence.controller';

const router = Router();
router.use(authenticate);

router.get('/revenue-leaks', IntelligenceController.getRevenueLeaks);
router.get('/:leadId/score', IntelligenceController.getDealScore);
router.get('/:leadId/action', IntelligenceController.getNextBestAction);
router.get('/:leadId/sla', IntelligenceController.getSlaStatus);
router.get('/:leadId/escalation', IntelligenceController.getEscalation);

export default router;
