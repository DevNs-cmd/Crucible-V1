import { Request, Response, NextFunction } from 'express';
import * as LeadsService from '../crm/leads.service';
import * as AutomationService from '../automation/automation.service';
import * as ActivityLogService from '../activity-log/activityLog.service';
import {
  CreateLeadSchema, UpdateLeadSchema, UpdateLeadStatusSchema, LeadFilterSchema,
} from '../../utils/validators';
import { sendSuccess, sendError } from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import { LeadStatus } from '../../models/lead.model';

/** GET /api/leads */
export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filterParsed = LeadFilterSchema.safeParse(req.query);
    if (!filterParsed.success) {
      sendError(res, 'Invalid query parameters', 422, filterParsed.error.flatten().fieldErrors);
      return;
    }
    const pagination = getPagination(req);
    const { leads, total } = await LeadsService.getLeads(
      {
        status: filterParsed.data.status as LeadStatus | undefined,
        assigned_to: filterParsed.data.assigned_to,
      },
      pagination
    );
    sendSuccess(res, leads, 'Leads fetched', 200, { page: pagination.page, limit: pagination.limit, total });
  } catch (err) {
    next(err);
  }
}

/** POST /api/leads */
export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }
    const lead = await LeadsService.createLead(parsed.data, req.user!.userId);
    try{
     await AutomationService.triggerNewLeadWebhook({
      leadId: lead.id,
      leadName: lead.full_name,
      company: lead.company,
      industry: lead.industry,
      assignedTo: lead.assigned_to,
      createdAt: lead.created_at,
    });
  } catch (webhookError){
    console.warn('[Webhook Warning] Failed to trigger new lead webhook:', webhookError);
  }
    sendSuccess(res, lead, 'Lead created', 201);
  } catch (err) {
    next(err);
  }
}

/** GET /api/leads/:id */
export async function getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await LeadsService.getLeadById(req.params['id']!);
    sendSuccess(res, lead, 'Lead fetched');
  } catch (err) {
    next(err);
  }
}

/** PUT /api/leads/:id */
export async function updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = UpdateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    const lead = await LeadsService.updateLead(req.params['id']!, parsed.data, req.user!.userId);
    sendSuccess(res, lead, 'Lead updated');
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/leads/:id */
export async function deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await LeadsService.deleteLead(req.params['id']!, req.user!.userId);
    sendSuccess(res, null, 'Lead deleted');
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/leads/:id/status */
export async function updateLeadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = UpdateLeadStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.flatten().fieldErrors);
      return;
    }

    const nextStatus = parsed.data.status as LeadStatus;

    const { lead, oldStatus } = await LeadsService.updateLeadStatus(req.params['id']!, nextStatus, req.user!.userId);
    AutomationService.triggerStatusChangeWebhook({
      leadId: lead.id,
      leadName: lead.full_name,
      company: lead.company,
      oldStatus,
      newStatus: nextStatus,
      changedBy: req.user!.userId,
      changedAt: new Date().toISOString(),
    });
    sendSuccess(res, lead, 'Status updated');
  } catch (err) {
    next(err);
  }
}

/** GET /api/leads/:id/activity */
export async function getLeadActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const pagination = getPagination(req);
    const { logs, total } = await ActivityLogService.getActivityLogs(
      {
        entity_type: 'lead',
        entity_id: id,
      },
      pagination
    );
    sendSuccess(res, logs, 'Lead activity logs fetched', 200, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (err) {
    next(err);
  }
}