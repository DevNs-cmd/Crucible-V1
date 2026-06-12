import { Router } from 'express';
import * as AuditController from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth';
import { auditLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/generate', authenticate, auditLimiter, AuditController.generateAudit);

export default router;
