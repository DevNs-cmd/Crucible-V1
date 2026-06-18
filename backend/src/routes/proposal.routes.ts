import { Router } from 'express';
import * as ProposalController from '../controllers/proposal.controller';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();
router.post('/generate', authenticate, aiLimiter, ProposalController.generateProposal);

export default router;
