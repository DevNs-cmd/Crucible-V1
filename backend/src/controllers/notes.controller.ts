import { Request, Response, NextFunction } from 'express';
import * as NotesService from '../services/notes.service';
import { CreateNoteSchema } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/leads/:id/notes
 */
export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notes = await NotesService.getNotesByLeadId(req.params['id']!);
    sendSuccess(res, notes, 'Notes fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/leads/:id/notes
 */
export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    const note = await NotesService.createNote(req.params['id']!, req.user!.userId, parsed.data);
    sendSuccess(res, note, 'Note created successfully', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/leads/:id/notes/:noteId
 */
export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await NotesService.deleteNote(req.params['id']!, req.params['noteId']!);
    sendSuccess(res, null, 'Note deleted successfully');
  } catch (err) {
    next(err);
  }
}
