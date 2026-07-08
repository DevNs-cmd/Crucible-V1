"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { ProposalForm } from "@/app/proposals/components/ProposalForm";
import { ProposalPreview } from "@/app/proposals/components/ProposalPreview";
import {
  apiRequest,
  type Proposal,
  type ProposalGenerateInput,
  type ProposalGenerateResponse,
} from "@/app/lib/api";
import { getErrorMessage } from "@/app/lib/crm";
import { useAuth } from "@/app/providers/auth-provider";

export default function ProposalsPage() {
  const { token } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateProposal = async (input: ProposalGenerateInput) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<ProposalGenerateResponse>("/proposals/generate", {
        method: "POST",
        token,
        body: input,
      });
      setProposal(data.proposal);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell section="AI Proposals">
        <main className="mx-auto max-w-[1400px] space-y-7 px-6 py-8">
          <PageHeader
            eyebrow="Proposal Generator"
            title="AI Sales Proposal"
            description="Create professional, data-driven sales proposals instantly with AI-generated content tailored to your leads and opportunities."
          />

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
            <ProposalForm isLoading={isLoading} onSubmit={generateProposal} />
            <ProposalPreview proposal={proposal} />
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
