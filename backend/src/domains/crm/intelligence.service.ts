import { ActivityLog } from '../../models/activityLog.model';
import { LeadStatus, LeadWithRelations } from '../../models/lead.model';
import { PaginationParams } from '../../utils/pagination';
import * as ActivityLogService from '../activity-log/activityLog.service';
import * as LeadsService from './leads.service';

type Confidence = 'low' | 'medium' | 'high';
type RevenueLeakSeverity = 'low' | 'medium' | 'high';
type NextBestAction = 'Contact Lead' | 'Schedule Meeting' | 'Send Proposal' | 'Follow Up' | 'Close Deal';
type EscalationLevel = 'none' | 'team_lead' | 'manager' | 'executive';

export interface DealScoreResult {
  leadId: string;
  score: number;
  confidence: Confidence;
  reasons: string[];
}

export interface NextBestActionResult {
  leadId: string;
  action: NextBestAction;
  reason: string;
}

export interface RevenueLeakResult {
  leadId: string;
  severity: RevenueLeakSeverity;
  reason: string;
}

export interface SlaBreachResult {
  breached: boolean;
  stage: LeadStatus;
  overdueDays: number;
}

export interface EscalationResult {
  level: EscalationLevel;
  reason: string;
  recommendation: string;
}

interface LeadIntelligenceContext {
  lead: LeadWithRelations;
  activityLogs: ActivityLog[];
  now: Date;
}

interface RevenueLeakAnalysis {
  points: number;
  reasons: string[];
}

export const CRM_STAGE_SLA_THRESHOLDS_DAYS: Record<LeadStatus, number> = {
  new: 2,
  contacted: 5,
  proposal: 7,
  negotiation: 10,
  closed_won: Number.POSITIVE_INFINITY,
  closed_lost: Number.POSITIVE_INFINITY,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_VALUE_DEAL_THRESHOLD = 10000;
const ENTERPRISE_VALUE_DEAL_THRESHOLD = 25000;
const RECENT_ACTIVITY_DAYS = 7;
const STALE_ACTIVITY_DAYS = 14;
const INACTIVE_ACTIVITY_DAYS = 30;
const LEAD_PAGE_SIZE = 100;

const STATUS_SCORE: Record<LeadStatus, number> = {
  new: 15,
  contacted: 30,
  proposal: 55,
  negotiation: 70,
  closed_won: 100,
  closed_lost: 0,
};

const REVENUE_LEAK_SEVERITY_RANK: Record<RevenueLeakSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export async function getDealScore(leadId: string): Promise<DealScoreResult> {
  const context = await getLeadContext(leadId);
  return calculateDealScore(context);
}

export async function getNextBestAction(leadId: string): Promise<NextBestActionResult> {
  const context = await getLeadContext(leadId);
  return calculateNextBestAction(context);
}

export async function getSlaStatus(leadId: string): Promise<SlaBreachResult> {
  const context = await getLeadContext(leadId);
  return calculateSlaStatus(context);
}

export async function getEscalation(leadId: string): Promise<EscalationResult> {
  const context = await getLeadContext(leadId);
  return calculateEscalation(context);
}

export async function getRevenueLeaks(): Promise<RevenueLeakResult[]> {
  const contexts = await getAllLeadContexts();

  return contexts
    .map((context) => {
      const analysis = analyzeRevenueLeak(context);
      if (analysis.points < 3) return null;

      return {
        leadId: context.lead.id,
        severity: getRevenueLeakSeverity(analysis.points),
        reason: analysis.reasons.join('; '),
      };
    })
    .filter((leak): leak is RevenueLeakResult => leak !== null)
    .sort((a, b) => {
      const severityDelta = REVENUE_LEAK_SEVERITY_RANK[b.severity] - REVENUE_LEAK_SEVERITY_RANK[a.severity];
      if (severityDelta !== 0) return severityDelta;
      return a.leadId.localeCompare(b.leadId);
    });
}

async function getLeadContext(leadId: string): Promise<LeadIntelligenceContext> {
  const lead = await LeadsService.getLeadById(leadId);
  const activityLogs = await getLeadActivityLogs(leadId);
  return {
    lead: normalizeLeadRelations(lead),
    activityLogs,
    now: new Date(),
  };
}

async function getAllLeadContexts(): Promise<LeadIntelligenceContext[]> {
  const leads: LeadWithRelations[] = [];
  let page = 1;
  let total = 0;

  do {
    const pagination: PaginationParams = {
      page,
      limit: LEAD_PAGE_SIZE,
      offset: (page - 1) * LEAD_PAGE_SIZE,
    };
    const result = await LeadsService.getLeads({}, pagination);
    total = result.total;

    const hydratedLeads = await Promise.all(
      result.leads.map((lead) => LeadsService.getLeadById(lead.id))
    );
    leads.push(...hydratedLeads.map(normalizeLeadRelations));
    page += 1;
  } while (leads.length < total);

  const now = new Date();
  return Promise.all(
    leads.map(async (lead) => ({
      lead,
      activityLogs: await getLeadActivityLogs(lead.id),
      now,
    }))
  );
}

async function getLeadActivityLogs(leadId: string): Promise<ActivityLog[]> {
  try {
    const { logs } = await ActivityLogService.getActivityLogs(
      { entity_type: 'lead', entity_id: leadId },
      { page: 1, limit: 100, offset: 0 }
    );
    return logs;
  } catch (err) {
    console.warn('[CRM Intelligence] Activity log lookup failed, using lead timestamps only.');
    return [];
  }
}

function normalizeLeadRelations(lead: LeadWithRelations): LeadWithRelations {
  return {
    ...lead,
    notes: lead.notes ?? [],
    meetings: lead.meetings ?? [],
    followups: lead.followups ?? [],
  };
}

function calculateDealScore(context: LeadIntelligenceContext): DealScoreResult {
  const { lead } = context;

  if (lead.status === 'closed_won') {
    return {
      leadId: lead.id,
      score: 100,
      confidence: getConfidence(context),
      reasons: ['Lead is already closed won.'],
    };
  }

  if (lead.status === 'closed_lost') {
    return {
      leadId: lead.id,
      score: 0,
      confidence: getConfidence(context),
      reasons: ['Lead is already closed lost.'],
    };
  }

  let score = STATUS_SCORE[lead.status];
  const reasons: string[] = [`Status ${lead.status} contributes ${STATUS_SCORE[lead.status]} baseline points.`];
  const daysSinceActivity = getDaysSinceLastActivity(context);
  const openFollowUps = getOpenFollowUps(context);
  const overdueFollowUps = getOverdueFollowUps(context);
  const futureFollowUps = getFutureFollowUps(context);
  const meetings = lead.meetings ?? [];

  if (lead.company) {
    score += 8;
    reasons.push('Company information is present.');
  } else {
    score -= 8;
    reasons.push('Missing company information lowers qualification confidence.');
  }

  if (lead.assigned_to) {
    score += 10;
    reasons.push('Lead has an assigned owner.');
  } else {
    score -= 15;
    reasons.push('Lead has no assigned owner.');
  }

  if ((lead.value ?? 0) > 0) {
    score += 10;
    reasons.push('Deal value is captured.');
    if ((lead.value ?? 0) >= HIGH_VALUE_DEAL_THRESHOLD) {
      score += 5;
      reasons.push('High deal value increases sales priority.');
    }
  } else {
    score -= 8;
    reasons.push('Missing deal value reduces forecast strength.');
  }

  if (daysSinceActivity <= RECENT_ACTIVITY_DAYS) {
    score += 15;
    reasons.push('Recent CRM activity is present.');
  } else if (daysSinceActivity <= STALE_ACTIVITY_DAYS) {
    score += 8;
    reasons.push('CRM activity exists but is becoming stale.');
  } else if (Number.isFinite(daysSinceActivity)) {
    score -= 12;
    reasons.push('Lead has been inactive for more than two weeks.');
  } else {
    score -= 15;
    reasons.push('No CRM activity has been recorded.');
  }

  if (futureFollowUps.length > 0) {
    score += 10;
    reasons.push('Open future follow-up is scheduled.');
  } else if (overdueFollowUps.length > 0) {
    score -= 12;
    reasons.push('Lead has overdue follow-ups.');
  } else if (openFollowUps.length === 0) {
    score -= 8;
    reasons.push('Lead has no open follow-up.');
  }

  if (meetings.length > 0) {
    score += 10;
    reasons.push('Meeting history exists for the lead.');
    if (getMostRecentMeetingDays(context) <= RECENT_ACTIVITY_DAYS) {
      score += 5;
      reasons.push('Recent meeting strengthens buying intent.');
    }
  } else if (lead.status === 'proposal' || lead.status === 'negotiation') {
    score -= 12;
    reasons.push('Advanced stage lead has no meeting history.');
  }

  return {
    leadId: lead.id,
    score: clampScore(score),
    confidence: getConfidence(context),
    reasons,
  };
}

function calculateNextBestAction(context: LeadIntelligenceContext): NextBestActionResult {
  const { lead } = context;
  const daysSinceActivity = getDaysSinceLastActivity(context);
  const meetings = lead.meetings ?? [];
  const overdueFollowUps = getOverdueFollowUps(context);
  const futureFollowUps = getFutureFollowUps(context);

  if (lead.status === 'closed_won' || lead.status === 'closed_lost') {
    return {
      leadId: lead.id,
      action: 'Close Deal',
      reason: 'Lead is already in a terminal stage; confirm close-out details are complete.',
    };
  }

  if (!lead.assigned_to) {
    return {
      leadId: lead.id,
      action: 'Contact Lead',
      reason: 'Lead has no assigned owner, so immediate contact ownership should be established.',
    };
  }

  if (overdueFollowUps.length > 0) {
    return {
      leadId: lead.id,
      action: 'Follow Up',
      reason: 'There is an overdue follow-up for this lead.',
    };
  }

  if (lead.status === 'new') {
    return {
      leadId: lead.id,
      action: 'Contact Lead',
      reason: 'New lead needs first contact before it can progress.',
    };
  }

  if (lead.status === 'contacted' && meetings.length === 0) {
    return {
      leadId: lead.id,
      action: 'Schedule Meeting',
      reason: 'Lead has been contacted but no meeting has been logged.',
    };
  }

  if (lead.status === 'contacted' && meetings.length > 0) {
    return {
      leadId: lead.id,
      action: 'Send Proposal',
      reason: 'Lead has contact and meeting history, making proposal preparation the next logical step.',
    };
  }

  if (lead.status === 'proposal') {
    return {
      leadId: lead.id,
      action: 'Follow Up',
      reason: 'Proposal-stage leads need consistent follow-up to prevent deal drift.',
    };
  }

  if (lead.status === 'negotiation') {
    if (daysSinceActivity <= RECENT_ACTIVITY_DAYS && futureFollowUps.length > 0) {
      return {
        leadId: lead.id,
        action: 'Close Deal',
        reason: 'Negotiation is active and a follow-up path is already in place.',
      };
    }

    return {
      leadId: lead.id,
      action: 'Follow Up',
      reason: 'Negotiation-stage lead needs renewed engagement before close.',
    };
  }

  if (futureFollowUps.length === 0) {
    return {
      leadId: lead.id,
      action: 'Follow Up',
      reason: 'No future follow-up is scheduled.',
    };
  }

  return {
    leadId: lead.id,
    action: 'Contact Lead',
    reason: 'Lead has no higher-priority action triggered by current CRM signals.',
  };
}

function calculateSlaStatus(context: LeadIntelligenceContext): SlaBreachResult {
  const { lead, now } = context;
  const thresholdDays = CRM_STAGE_SLA_THRESHOLDS_DAYS[lead.status];

  if (!Number.isFinite(thresholdDays)) {
    return {
      breached: false,
      stage: lead.status,
      overdueDays: 0,
    };
  }

  const stageStartedAt = getStageStartedAt(context);
  const overdueDays = getOverdueDays(stageStartedAt, thresholdDays, now);

  return {
    breached: overdueDays > 0,
    stage: lead.status,
    overdueDays,
  };
}

function calculateEscalation(context: LeadIntelligenceContext): EscalationResult {
  const { lead } = context;
  const sla = calculateSlaStatus(context);

  if (!sla.breached) {
    return {
      level: 'none',
      reason: 'No CRM stage SLA breach detected.',
      recommendation: 'Continue the normal sales cadence.',
    };
  }

  if (sla.overdueDays >= 7 || (lead.value ?? 0) >= ENTERPRISE_VALUE_DEAL_THRESHOLD) {
    return {
      level: 'executive',
      reason: `${sla.stage} stage SLA is overdue by ${sla.overdueDays} day(s).`,
      recommendation: lead.assigned_to
        ? 'Run an executive deal review and confirm a recovery plan with the assigned owner.'
        : 'Assign an owner immediately and run an executive deal review.',
    };
  }

  if (sla.overdueDays >= 3 || !lead.assigned_to) {
    return {
      level: 'manager',
      reason: `${sla.stage} stage SLA is overdue by ${sla.overdueDays} day(s).`,
      recommendation: lead.assigned_to
        ? 'Sales manager should review next steps and unblock progression.'
        : 'Sales manager should assign an owner before further follow-up.',
    };
  }

  return {
    level: 'team_lead',
    reason: `${sla.stage} stage SLA is overdue by ${sla.overdueDays} day(s).`,
    recommendation: 'Team lead should verify the next action and restore follow-up cadence.',
  };
}

function analyzeRevenueLeak(context: LeadIntelligenceContext): RevenueLeakAnalysis {
  const { lead } = context;

  if (lead.status === 'closed_won' || lead.status === 'closed_lost') {
    return { points: 0, reasons: [] };
  }

  let points = 0;
  const reasons: string[] = [];
  const daysSinceActivity = getDaysSinceLastActivity(context);
  const sla = calculateSlaStatus(context);
  const futureFollowUps = getFutureFollowUps(context);
  const overdueFollowUps = getOverdueFollowUps(context);
  const meetings = lead.meetings ?? [];

  if ((lead.value ?? 0) >= HIGH_VALUE_DEAL_THRESHOLD && daysSinceActivity > STALE_ACTIVITY_DAYS) {
    points += 3;
    reasons.push('High-value lead has stale activity');
  }

  if (!lead.assigned_to) {
    points += 3;
    reasons.push('No assigned owner');
  }

  if (futureFollowUps.length === 0) {
    points += 2;
    reasons.push('No future follow-up scheduled');
  }

  if (overdueFollowUps.length > 0) {
    points += 2;
    reasons.push('Follow-up is overdue');
  }

  if (meetings.length === 0) {
    points += lead.status === 'proposal' || lead.status === 'negotiation' ? 2 : 1;
    reasons.push('No meetings logged');
  }

  if (sla.breached) {
    points += 2;
    reasons.push(`${sla.stage} stage SLA breached by ${sla.overdueDays} day(s)`);
  }

  if (daysSinceActivity > INACTIVE_ACTIVITY_DAYS) {
    points += 2;
    reasons.push('No activity for more than 30 days');
  }

  return { points, reasons };
}

function getRevenueLeakSeverity(points: number): RevenueLeakSeverity {
  if (points >= 7) return 'high';
  if (points >= 4) return 'medium';
  return 'low';
}

function getConfidence(context: LeadIntelligenceContext): Confidence {
  const { lead, activityLogs } = context;
  const signalCount = [
    Boolean(lead.company),
    Boolean(lead.assigned_to),
    (lead.value ?? 0) > 0,
    (lead.notes ?? []).length > 0 || activityLogs.length > 0,
    (lead.followups ?? []).length > 0,
    (lead.meetings ?? []).length > 0,
  ].filter(Boolean).length;

  if (signalCount >= 5) return 'high';
  if (signalCount >= 3) return 'medium';
  return 'low';
}

function getStageStartedAt(context: LeadIntelligenceContext): Date {
  const { lead, activityLogs } = context;
  const matchingStageChange = activityLogs.find((log) => {
    const beforeStatus = getStateStatus(log.before_state);
    const afterStatus = getStateStatus(log.after_state);
    return afterStatus === lead.status && beforeStatus !== afterStatus;
  });

  if (matchingStageChange) {
    return toDate(matchingStageChange.created_at) ?? toDate(lead.updated_at) ?? toDate(lead.created_at) ?? context.now;
  }

  if (lead.status === 'new') {
    return toDate(lead.created_at) ?? context.now;
  }

  return toDate(lead.updated_at) ?? toDate(lead.created_at) ?? context.now;
}

function getStateStatus(state: unknown): LeadStatus | undefined {
  if (!state || typeof state !== 'object') return undefined;
  const status = (state as { status?: unknown }).status;
  return isLeadStatus(status) ? status : undefined;
}

function isLeadStatus(status: unknown): status is LeadStatus {
  return (
    status === 'new' ||
    status === 'contacted' ||
    status === 'proposal' ||
    status === 'negotiation' ||
    status === 'closed_won' ||
    status === 'closed_lost'
  );
}

function getDaysSinceLastActivity(context: LeadIntelligenceContext): number {
  const mostRecentActivity = getMostRecentActivityDate(context);
  if (!mostRecentActivity) return Number.POSITIVE_INFINITY;
  return getDaysBetween(mostRecentActivity, context.now);
}

function getMostRecentMeetingDays(context: LeadIntelligenceContext): number {
  const meetingDates = (context.lead.meetings ?? []).map((meeting) => toDate(meeting.met_at) ?? toDate(meeting.created_at));
  const mostRecentMeeting = getMostRecentDate(meetingDates);
  if (!mostRecentMeeting) return Number.POSITIVE_INFINITY;
  return getDaysBetween(mostRecentMeeting, context.now);
}

function getMostRecentActivityDate(context: LeadIntelligenceContext): Date | null {
  const { lead, activityLogs } = context;
  return getMostRecentDate([
    toDate(lead.updated_at),
    ...(lead.notes ?? []).map((note) => toDate(note.created_at)),
    ...(lead.meetings ?? []).map((meeting) => toDate(meeting.met_at) ?? toDate(meeting.created_at)),
    ...(lead.followups ?? []).map((followup) => (
      toDate(followup.completed_at) ?? toDate(followup.created_at) ?? toDate(followup.due_at)
    )),
    ...activityLogs.map((log) => toDate(log.created_at)),
  ]);
}

function getOpenFollowUps(context: LeadIntelligenceContext) {
  return (context.lead.followups ?? []).filter((followup) => !followup.completed);
}

function getFutureFollowUps(context: LeadIntelligenceContext) {
  return getOpenFollowUps(context).filter((followup) => {
    const dueAt = toDate(followup.due_at);
    return dueAt !== null && dueAt.getTime() >= context.now.getTime();
  });
}

function getOverdueFollowUps(context: LeadIntelligenceContext) {
  return getOpenFollowUps(context).filter((followup) => {
    const dueAt = toDate(followup.due_at);
    return dueAt !== null && dueAt.getTime() < context.now.getTime();
  });
}

function getOverdueDays(stageStartedAt: Date, thresholdDays: number, now: Date): number {
  const overdueMs = now.getTime() - stageStartedAt.getTime() - thresholdDays * DAY_MS;
  if (overdueMs <= 0) return 0;
  return Math.ceil(overdueMs / DAY_MS);
}

function getDaysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
}

function getMostRecentDate(dates: Array<Date | null>): Date | null {
  return dates.reduce<Date | null>((latest, date) => {
    if (!date) return latest;
    if (!latest || date.getTime() > latest.getTime()) return date;
    return latest;
  }, null);
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
