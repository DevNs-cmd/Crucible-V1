"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { AddLeadModal } from "@/app/crm/components/AddLeadModal";
import { LeadColumn } from "@/app/crm/components/LeadColumn";
import { PipelineSummary } from "@/app/crm/components/PipelineSummary";
import {
  apiRequest,
  type CreateLeadInput,
  type Lead,
  type LeadStatus,
} from "@/app/lib/api";
import {
  formatCurrency,
  getErrorMessage,
  leadValue,
  STATUS_COLUMNS,
} from "@/app/lib/crm";
import { useAuth } from "@/app/providers/auth-provider";

export default function CRMPage() {
  const { token, status: authStatus } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<LeadStatus>("new");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (authStatus !== "authenticated" || !token) return;

    let active = true;

    async function fetchLeads() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiRequest<Lead[]>("/leads?limit=250", { token });
        if (active) setLeads(data);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchLeads();

    return () => {
      active = false;
    };
  }, [authStatus, token]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) => {
      return (
        lead.company.toLowerCase().includes(query) ||
        lead.full_name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        (lead.industry ?? "").toLowerCase().includes(query)
      );
    });
  }, [leads, search]);

  const totalPipeline = leads.reduce((sum, lead) => sum + leadValue(lead), 0);
  const wonValue = leads
    .filter((lead) => lead.status === "closed_won")
    .reduce((sum, lead) => sum + leadValue(lead), 0);

  const openAddLead = (status: LeadStatus = "new") => {
    setModalStatus(status);
    setModalError("");
    setShowModal(true);
  };

  const addLead = async (data: CreateLeadInput) => {
    if (!token) return;

    setIsSaving(true);
    setModalError("");

    try {
      const newLead = await apiRequest<Lead>("/leads", {
        method: "POST",
        token,
        body: data,
      });
      setLeads((prev) => [newLead, ...prev]);
      setShowModal(false);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const moveLead = async (id: string, dir: 1 | -1) => {
    if (!token || updatingLeadId) return;

    const lead = leads.find((item) => item.id === id);
    if (!lead) return;

    const currentIndex = STATUS_COLUMNS.findIndex(
      (status) => status.value === lead.status
    );
    const next = STATUS_COLUMNS[currentIndex + dir];
    if (!next) return;

    const previousLeads = leads;
    setUpdatingLeadId(id);
    setLoadError("");
    setLeads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: next.value } : item))
    );

    try {
      const updatedLead = await apiRequest<Lead>(`/leads/${id}/status`, {
        method: "PATCH",
        token,
        body: { status: next.value },
      });
      setLeads((prev) => prev.map((item) => (item.id === id ? updatedLead : item)));
    } catch (err) {
      setLeads(previousLeads);
      setLoadError(getErrorMessage(err));
    } finally {
      setUpdatingLeadId(null);
    }
  };

  return (
    <AppShell
      section="CRM Pipeline"
      actions={
        <button
          type="button"
          onClick={() => openAddLead()}
          className="whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-700"
        >
          Add Lead
        </button>
      }
    >
      {showModal && (
        <AddLeadModal
          initialStatus={modalStatus}
          isSaving={isSaving}
          error={modalError}
          onClose={() => setShowModal(false)}
          onAdd={addLead}
        />
      )}

      <main className="mx-auto max-w-[1600px] space-y-7 px-6 py-8">
        <PageHeader
          eyebrow="Lead Management"
          title="Business Pipeline"
          description="Kanban account tracking across backend lifecycle statuses."
          aside={
            <div className="flex flex-wrap items-center gap-4 sm:text-right">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Total Pipeline
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {formatCurrency(totalPipeline)}
                </p>
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Won Value
                </p>
                <p className="text-xl font-extrabold text-emerald-600">
                  {formatCurrency(wonValue)}
                </p>
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Total Leads
                </p>
                <p className="text-xl font-extrabold text-slate-900">{leads.length}</p>
              </div>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 max-w-sm flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search company, name, email, industry..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          {isLoading && (
            <span className="text-xs font-semibold text-slate-400">Loading leads...</span>
          )}
          {loadError && (
            <span className="text-xs font-semibold text-red-600">{loadError}</span>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {STATUS_COLUMNS.map((status) => (
            <LeadColumn
              key={status.value}
              status={status}
              leads={filtered.filter((lead) => lead.status === status.value)}
              updatingLeadId={updatingLeadId}
              onMoveLead={moveLead}
              onAddLead={openAddLead}
            />
          ))}
        </div>

        <PipelineSummary leads={leads} />
      </main>
    </AppShell>
  );
}

