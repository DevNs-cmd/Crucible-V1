import { Router } from 'express';
import * as LeadsController from '../controllers/leads.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', LeadsController.getLeads);
router.post('/', LeadsController.createLead);
router.get('/:id', LeadsController.getLeadById);
router.put('/:id', LeadsController.updateLead);
router.delete('/:id', LeadsController.deleteLead);
router.patch('/:id/status', LeadsController.updateLeadStatus);

export default router;
