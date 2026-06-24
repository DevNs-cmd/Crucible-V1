const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export type LeadStatus =
  | "new"
  | "contacted"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  status: LeadStatus;
  source: string | null;
  assigned_to: string | null;
  value: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  status?: LeadStatus;
  source?: string;
  assigned_to?: string;
  value?: number;
}

export interface UpdateLeadInput {
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  status?: LeadStatus;
  source?: string;
  assigned_to?: string;
  value?: number;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface CreateNoteInput {
  content: string;
}

export interface LeadMeeting {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  met_at: string;
  outcome: string | null;
  notes?: string | null;
  created_at: string;
}

export interface CreateMeetingInput {
  title: string;
  met_at: string;
  outcome?: string;
  notes?: string;
}

export interface LeadFollowup {
  id: string;
  lead_id: string;
  user_id: string;
  due_at: string;
  description: string;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
}

export interface CreateFollowupInput {
  due_at: string;
  description: string;
}

export type BudgetTier = "low" | "medium" | "high";

export interface AuditGenerateInput {
  companyName: string;
  industry: string;
  companyType: string;
  companySize: string;
  problems: string[];
  currentTools?: string[];
  budget: BudgetTier;
}

export interface AuditPainPoint {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface AuditRecommendation {
  title: string;
  description: string;
  priority: number;
  estimatedImpact: string;
}

export interface AuditOpportunity {
  area: string;
  solution: string;
  tools: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface AuditRoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  tasks: string[];
}

export interface AuditReport {
  executiveSummary: string;
  painPoints: AuditPainPoint[];
  recommendations: AuditRecommendation[];
  aiOpportunities: AuditOpportunity[];
  estimatedROI: string;
  implementationRoadmap: AuditRoadmapPhase[];
}

export interface AuditGenerateResponse {
  report: AuditReport;
  generatedAt: string;
}

export interface ProposalGenerateInput {
  companyName: string;
  industry: string;
  servicesRequired: string[];
  problems: string;
  budget: BudgetTier;
  contactName?: string;
  contactEmail?: string;
}

export interface ProposalServiceBreakdown {
  service: string;
  description: string;
  deliverables: string[];
  timeline: string;
}

export interface Proposal {
  title: string;
  introduction: string;
  problemStatement: string;
  proposedSolution: string;
  servicesBreakdown: ProposalServiceBreakdown[];
  investmentSummary: string;
  whyAlgoForce: string;
  nextSteps: string[];
  termsAndConditions: string;
}

export interface ProposalGenerateResponse {
  proposal: Proposal;
  generatedAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  closedWon: number;
  closedLost: number;
  totalPipelineValue: number;
  conversionRate: number;
  overdueFollowUps: number;
}

export interface LeadsByStatus {
  status: LeadStatus;
  count: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface TopPerformer {
  userId: string;
  fullName: string;
  closedWon: number;
  totalValue: number;
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (response.status === 204
    ? { success: true, data: null as T }
    : await response.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && "error" in payload
        ? payload.error
        : `Request failed with status ${response.status}`;
    const details = payload && "details" in payload ? payload.details : undefined;
    throw new ApiRequestError(message, response.status, details);
  }

  return payload.data;
}
