export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

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
  email: string;
  phone: string | null;
  company: string;
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
  email: string;
  company: string;
  industry?: string;
  status?: LeadStatus;
  value?: number;
}

export interface UpdateLeadInput {
  full_name?: string;
  email?: string;
  phone?: string | null;
  company?: string;
  industry?: string | null;
  source?: string | null;
  assigned_to?: string | null;
  value?: number | null;
}

export interface LeadNote {
  id: string;
  lead_id?: string;
  content?: string | null;
  body?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateNoteInput {
  content: string;
}

export interface LeadMeeting {
  id: string;
  lead_id?: string;
  title?: string | null;
  scheduled_at?: string | null;
  starts_at?: string | null;
  meeting_date?: string | null;
  location?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateMeetingInput {
  title: string;
  scheduled_at: string;
  location?: string;
  notes?: string;
}

export interface LeadFollowup {
  id: string;
  lead_id?: string;
  title?: string | null;
  due_date?: string | null;
  due_at?: string | null;
  notes?: string | null;
  status?: string | null;
  completed?: boolean | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateFollowupInput {
  title: string;
  due_date: string;
  notes?: string;
}

export interface UpdateFollowupInput {
  title?: string;
  due_date?: string;
  notes?: string;
  completed?: boolean;
  status?: string;
}

export interface AuditGenerateInput {
  companyName: string;
  industry: string;
  companyType: string;
  companySize: string;
  problems: string[];
  currentTools: string[];
  budget: string;
}

export interface AuditReport {
  executiveSummary?: string | string[];
  painPoints?: string | string[];
  recommendations?: string | string[];
  aiOpportunities?: string | string[];
  estimatedROI?: string | string[];
  implementationRoadmap?: string | string[];
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
