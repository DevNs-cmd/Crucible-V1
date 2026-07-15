import { Router } from 'express';
import * as ProposalController from './proposal.controller';
import { authenticate } from '../../middleware/auth';
import { aiLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.post('/generate', authenticate, aiLimiter, ProposalController.generateProposal);

export default router;
