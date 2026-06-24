import type { LeadFollowup, LeadMeeting } from "@/app/lib/api";

export type DashboardMeeting = LeadMeeting & {
  leadId: string;
  leadCompany: string;
  leadContact: string;
};

export type DashboardFollowup = LeadFollowup & {
  leadId: string;
  leadCompany: string;
  leadContact: string;
};

