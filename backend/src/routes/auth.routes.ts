import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
