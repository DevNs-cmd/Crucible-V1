"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { FollowupsWidget } from "@/app/dashboard/components/FollowupsWidget";
import { MetricsGrid } from "@/app/dashboard/components/MetricsGrid";
import { PipelineChart } from "@/app/dashboard/components/PipelineChart";
import { RecentLeads } from "@/app/dashboard/components/RecentLeads";
import { StaticActivityLog } from "@/app/dashboard/components/StaticActivityLog";
import { StaticIntegrationStatus } from "@/app/dashboard/components/StaticIntegrationStatus";
import { StaticSprintChecklist } from "@/app/dashboard/components/StaticSprintChecklist";
import { StaticSystemCards } from "@/app/dashboard/components/StaticSystemCards";
import { StatusDistribution } from "@/app/dashboard/components/StatusDistribution";
import { UpcomingMeetings } from "@/app/dashboard/components/UpcomingMeetings";
import type {
  DashboardFollowup,
  DashboardMeeting,
} from "@/app/dashboard/components/dashboard-types";
import {
  apiRequest,
  type Lead,
  type LeadFollowup,
  type LeadMeeting,
} from "@/app/lib/api";
import { getErrorMessage } from "@/app/lib/crm";
import { useAuth } from "@/app/providers/auth-provider";

export default function DashboardPage() {
  const { token, status: authStatus } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meetings, setMeetings] = useState<DashboardMeeting[]>([]);
  const [followups, setFollowups] = useState<DashboardFollowup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [relatedError, setRelatedError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState("");

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleString("en-US"));
    if (authStatus !== "authenticated" || !token) return;

    let active = true;

    async function fetchDashboard() {
      setIsLoading(true);
      setLoadError("");
      setRelatedError("");

      try {
        const leadData = await apiRequest<Lead[]>("/leads?limit=250", { token });
        if (!active) return;

        setLeads(leadData);

        if (leadData.length === 0) {
          setMeetings([]);
          setFollowups([]);
          return;
        }

        const [meetingResults, followupResults] = await Promise.all([
          Promise.allSettled(
            leadData.map(async (lead) => {
              const items = await apiRequest<LeadMeeting[]>(
                `/leads/${lead.id}/meetings`,
                { token }
              );
              return items.map((meeting) => ({
                ...meeting,
                leadId: lead.id,
                leadCompany: lead.company,
                leadContact: lead.full_name,
              }));
            })
          ),
          Promise.allSettled(
            leadData.map(async (lead) => {
              const items = await apiRequest<LeadFollowup[]>(
                `/leads/${lead.id}/followups`,
                { token }
              );
              return items.map((followup) => ({
                ...followup,
                leadId: lead.id,
                leadCompany: lead.company,
                leadContact: lead.full_name,
              }));
            })
          ),
        ]);

        if (!active) return;

        setMeetings(
          meetingResults.flatMap((result) =>
            result.status === "fulfilled" ? result.value : []
          )
        );
        setFollowups(
          followupResults.flatMap((result) =>
            result.status === "fulfilled" ? result.value : []
          )
        );

        if (
          meetingResults.some((result) => result.status === "rejected") ||
          followupResults.some((result) => result.status === "rejected")
        ) {
          setRelatedError("Some meeting or follow-up data could not be loaded.");
        }
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchDashboard();

    return () => {
      active = false;
    };
  }, [authStatus, token]);

  return (
    <AppShell section="Dev Operations">
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <PageHeader
          eyebrow="Executive Dashboard"
          title="Platform Control Panel"
          description="Live CRM metrics where backend APIs exist, with operational placeholders preserved."
          aside={
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">Last refreshed</p>
              <p className="text-sm font-semibold text-slate-700">
                {lastRefreshed || "Loading..."}
              </p>
            </div>
          }
        />

        {isLoading && (
          <p className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs font-semibold text-slate-400 shadow-sm">
            Loading dashboard data...
          </p>
        )}
        {loadError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {loadError}
          </p>
        )}
        {relatedError && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
            {relatedError}
          </p>
        )}

        <MetricsGrid leads={leads} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusDistribution leads={leads} />
          <PipelineChart leads={leads} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <RecentLeads leads={leads} />
          <UpcomingMeetings meetings={meetings} />
          <FollowupsWidget followups={followups} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StaticSprintChecklist />
          <StaticActivityLog />
        </div>

        <StaticIntegrationStatus />
        <StaticSystemCards />
      </main>
    </AppShell>
  );
}

