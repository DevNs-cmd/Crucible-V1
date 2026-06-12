import { Router } from 'express';
import * as NotesController from '../controllers/notes.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', NotesController.getNotes);
router.post('/', NotesController.createNote);
router.delete('/:noteId', NotesController.deleteNote);

export default router;
