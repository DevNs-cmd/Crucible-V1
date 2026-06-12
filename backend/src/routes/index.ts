import { Router } from 'express';
import authRoutes from './auth.routes';
import leadsRoutes from './leads.routes';
import notesRoutes from './notes.routes';
import meetingsRoutes from './meetings.routes';
import followupsRoutes from './followups.routes';
import auditRoutes from './audit.routes';
import webhooksRoutes from './webhooks.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);

// Nested lead sub-resources — use mergeParams so :id is available
router.use('/leads/:id/notes', notesRoutes);
router.use('/leads/:id/meetings', meetingsRoutes);
router.use('/leads/:id/followups', followupsRoutes);

router.use('/audit', auditRoutes);
router.use('/webhooks', webhooksRoutes);

export default router;
