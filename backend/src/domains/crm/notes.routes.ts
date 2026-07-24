import { Router } from 'express';
import * as NotesController from './notes.controller';
import { authenticate } from '../../middleware/auth';
import { crmLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });
router.use(authenticate);
router.use(crmLimiter);

router.get('/', NotesController.getNotes);
router.post('/', NotesController.createNote);
router.delete('/:noteId', NotesController.deleteNote);

export default router;
