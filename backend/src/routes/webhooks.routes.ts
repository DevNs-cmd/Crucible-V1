import { Router } from 'express';
import * as WebhooksController from '../controllers/webhooks.controller';

// Called by n8n server-to-server — no JWT auth required
const router = Router();

router.post('/email/new-lead', WebhooksController.handleNewLeadEmail);
router.post('/email/status-change', WebhooksController.handleStatusChangeEmail);
router.post('/email/followup-reminder', WebhooksController.handleFollowUpReminderEmail);

export default router;
