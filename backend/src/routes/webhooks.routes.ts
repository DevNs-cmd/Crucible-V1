import { Router } from 'express';
import * as WebhooksController from '../controllers/webhooks.controller';

// Webhook endpoints are called by n8n, not by the frontend.
// They are intentionally not behind JWT auth — secure via shared secret header in production.
const router = Router();

router.post('/email/new-lead', WebhooksController.handleNewLeadEmail);
router.post('/email/status-change', WebhooksController.handleStatusChangeEmail);
router.post('/email/followup-reminder', WebhooksController.handleFollowUpReminderEmail);

export default router;
