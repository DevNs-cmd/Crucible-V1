"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { AuditForm } from "@/app/audit/components/AuditForm";
import { AuditReport } from "@/app/audit/components/AuditReport";
import {
  apiRequest,
  type AuditGenerateInput,
  type AuditGenerateResponse,
  type AuditReport as AuditReportData,
} from "@/app/lib/api";
import { getErrorMessage } from "@/app/lib/crm";
import { useAuth } from "@/app/providers/auth-provider";

export default function AuditPage() {
  const { token } = useAuth();
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateAudit = async (input: AuditGenerateInput) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<AuditGenerateResponse>("/audit/generate", {
        method: "POST",
        token,
        body: input,
      });
      setReport(data.report);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell section="AI Audit">
      <main className="mx-auto max-w-[1400px] space-y-7 px-6 py-8">
        <PageHeader
          eyebrow="Audit Generator"
          title="AI Readiness Audit"
          description="Gain actionable insights into your sales process health and identify optimization opportunities with AI-powered analysis."
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          <AuditForm isLoading={isLoading} onSubmit={generateAudit} />
          <AuditReport report={report} />
        </div>
      </main>
    </AppShell>
    </ProtectedRoute>
  );
}

