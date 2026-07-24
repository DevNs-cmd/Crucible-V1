import { Router } from 'express';
import * as LeadsController from './leads.controller';
import { authenticate } from '../../middleware/auth';
import { crmLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.use(authenticate);
router.use(crmLimiter);

router.get('/', LeadsController.getLeads);
router.post('/', LeadsController.createLead);
router.get('/:id', LeadsController.getLeadById);
router.put('/:id', LeadsController.updateLead);
router.delete('/:id', LeadsController.deleteLead);
router.patch('/:id/status', LeadsController.updateLeadStatus);
router.get('/:id/activity', LeadsController.getLeadActivity);


export default router;
