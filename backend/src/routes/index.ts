import { Router } from 'express';
import authRoutes from '../domains/auth/auth.routes';
import leadsRoutes from '../domains/crm/leads.routes';
import notesRoutes from '../domains/crm/notes.routes';
import meetingsRoutes from '../domains/crm/meetings.routes';
import followupsRoutes from '../domains/crm/followups.routes';
import auditRoutes from '../domains/ai/audit.routes';
import proposalRoutes from '../domains/ai/proposal.routes';
import analyticsRoutes from '../domains/analytics/analytics.routes';
import webhooksRoutes from '../domains/automation/webhooks.routes';
import activityLogRoutes from '../domains/activity-log/activityLog.routes';
import executionRoutes from '../domains/automation/execution.routes'; 
import jobsRoutes from '../domains/automation/jobs.routes';

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
router.use('/activity-log', activityLogRoutes);
router.use('/executions', executionRoutes);
router.use('/jobs', jobsRoutes);

export default router;
