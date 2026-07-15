import { Router } from 'express';
import * as AuditController from './audit.controller';
import { authenticate } from '../../middleware/auth';
import { aiLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.post('/generate', authenticate, aiLimiter, AuditController.generateAudit);

export default router;
