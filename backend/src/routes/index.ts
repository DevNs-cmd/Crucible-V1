import { Router } from 'express';
import authRoutes from './auth.routes';
import leadsRoutes from './leads.routes';
import notesRoutes from './notes.routes';
import meetingsRoutes from './meetings.routes';
import followupsRoutes from './followups.routes';
import auditRoutes from './audit.routes';
import proposalRoutes from './proposal.routes';
import analyticsRoutes from './analytics.routes';
import webhooksRoutes from './webhooks.routes';
import executionRoutes from './execution.routes'; 

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/leads/:id/notes', notesRoutes);
router.use('/leads/:id/meetings', meetingsRoutes);
router.use('/leads/:id/followups', followupsRoutes);
router.use('/audit', auditRoutes);
router.use('/proposals', proposalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/executions', executionRoutes);

export default router;
