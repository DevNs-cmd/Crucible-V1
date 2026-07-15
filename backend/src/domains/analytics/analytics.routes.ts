import { Router } from 'express';
import * as AnalyticsController from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/dashboard', AnalyticsController.getDashboard);
router.get('/leads-by-status', AnalyticsController.getLeadsByStatus);
router.get('/revenue', AnalyticsController.getRevenue);
router.get('/top-performers', AnalyticsController.getTopPerformers);

export default router;
