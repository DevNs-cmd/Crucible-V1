import { ApiRequestError, type Lead, type LeadStatus } from "@/app/lib/api";

export type StatusColumn = {
  value: LeadStatus;
  label: string;
};

export const STATUS_COLUMNS: StatusColumn[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

export const STATUS_LABELS = STATUS_COLUMNS.reduce<Record<LeadStatus, string>>(
  (labels, status) => {
    labels[status.value] = status.label;
    return labels;
  },
  {
    new: "New",
    contacted: "Contacted",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  }
);

export const STATUS_CONFIG: Record<
  LeadStatus,
  { dot: string; header: string; badge: string; bar: string }
> = {
  new: {
    dot: "bg-slate-400",
    header: "border-t-slate-400",
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    bar: "bg-slate-400",
  },
  contacted: {
    dot: "bg-amber-400",
    header: "border-t-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "bg-amber-400",
  },
  proposal: {
    dot: "bg-blue-400",
    header: "border-t-blue-400",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    bar: "bg-blue-400",
  },
  negotiation: {
    dot: "bg-violet-400",
    header: "border-t-violet-400",
    badge: "bg-violet-50 text-violet-700 border border-violet-200",
    bar: "bg-violet-400",
  },
  closed_won: {
    dot: "bg-emerald-500",
    header: "border-t-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    bar: "bg-emerald-500",
  },
  closed_lost: {
    dot: "bg-red-400",
    header: "border-t-red-400",
    badge: "bg-red-50 text-red-700 border border-red-200",
    bar: "bg-red-400",
  },
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getErrorMessage(err: unknown) {
  return err instanceof ApiRequestError
    ? err.message
    : "Something went wrong. Please try again.";
}

export function leadValue(lead: Lead) {
  return Number(lead.value ?? 0);
}

export function initials(company: string) {
  const words = company.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return company.slice(0, 2).toUpperCase() || "LD";
}

export function getMeetingDate(meeting: {
  scheduled_at?: string | null;
  starts_at?: string | null;
  meeting_date?: string | null;
}) {
  return meeting.scheduled_at ?? meeting.starts_at ?? meeting.meeting_date ?? null;
}

export function getFollowupDate(followup: {
  due_date?: string | null;
  due_at?: string | null;
}) {
  return followup.due_date ?? followup.due_at ?? null;
}

export function isFollowupComplete(followup: {
  completed?: boolean | null;
  completed_at?: string | null;
  status?: string | null;
}) {
  return Boolean(followup.completed || followup.completed_at) || followup.status === "completed";
}

