"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { ConversionStats } from "@/app/reports/components/ConversionStats";
import { PipelineTable } from "@/app/reports/components/PipelineTable";
import { RevenueChart } from "@/app/reports/components/RevenueChart";
import { SourceTable } from "@/app/reports/components/SourceTable";
import { TopPerformersTable } from "@/app/reports/components/TopPerformersTable";
import {
  apiRequest,
  type DashboardStats,
  type Lead,
  type LeadsByStatus,
  type RevenueByMonth,
  type TopPerformer,
} from "@/app/lib/api";
import { getErrorMessage } from "@/app/lib/crm";
import { useAuth } from "@/app/providers/auth-provider";

export default function ReportsPage() {
  const { token, status: authStatus } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusCounts, setStatusCounts] = useState<LeadsByStatus[]>([]);
  const [revenue, setRevenue] = useState<RevenueByMonth[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus !== "authenticated" || !token) return;

    let active = true;

    async function fetchReportsData() {
      setIsLoading(true);
      setError("");

      try {
        const [dashboardStats, leadStatusCounts, revenueData, performers, leadData] =
          await Promise.all([
            apiRequest<DashboardStats>("/analytics/dashboard", { token }),
            apiRequest<LeadsByStatus[]>("/analytics/leads-by-status", { token }),
            apiRequest<RevenueByMonth[]>("/analytics/revenue", { token }),
            apiRequest<TopPerformer[]>("/analytics/top-performers", { token }),
            apiRequest<Lead[]>("/leads?limit=250", { token }),
          ]);
        if (active) {
          setStats(dashboardStats);
          setStatusCounts(leadStatusCounts);
          setLeads(leadData);
          setRevenue(revenueData);
          setTopPerformers(performers);
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchReportsData();

    return () => {
      active = false;
    };
  }, [authStatus, token]);

  return (
    <ProtectedRoute>
      <AppShell section="Reports">
      <main className="mx-auto max-w-[1400px] space-y-7 px-6 py-8">
        <PageHeader
          eyebrow="CRM Reports"
          title="Pipeline Analytics"
          description="Revenue, status, and conversion reporting from existing lead data only."
        />

        {isLoading && (
          <p className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs font-semibold text-slate-400 shadow-sm">
            Loading reports data...
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <ConversionStats stats={stats} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <RevenueChart revenue={revenue} />
          <SourceTable leads={leads} />
        </div>
        <TopPerformersTable performers={topPerformers} />
        <PipelineTable
          leads={leads}
          statusCounts={statusCounts}
          totalPipelineValue={stats?.totalPipelineValue ?? 0}
        />
      </main>
    </AppShell>
    </ProtectedRoute>
  );
}

