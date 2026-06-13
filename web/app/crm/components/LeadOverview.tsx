"use client";

import { useEffect, useState } from "react";
import type { Lead, LeadStatus, UpdateLeadInput } from "@/app/lib/api";
import {
  formatCurrency,
  formatDateTime,
  leadValue,
  STATUS_COLUMNS,
  STATUS_CONFIG,
  STATUS_LABELS,
} from "@/app/lib/crm";

type LeadEditForm = {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  source: string;
  assigned_to: string;
  value: string;
};

interface LeadOverviewProps {
  lead: Lead;
  isSaving: boolean;
  isUpdatingStatus: boolean;
  isDeleting: boolean;
  error: string;
  onSave: (input: UpdateLeadInput) => Promise<void>;
  onStatusUpdate: (status: LeadStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}

function buildForm(lead: Lead): LeadEditForm {
  return {
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone ?? "",
    company: lead.company,
    industry: lead.industry ?? "",
    source: lead.source ?? "",
    assigned_to: lead.assigned_to ?? "",
    value: lead.value === null || lead.value === undefined ? "" : String(lead.value),
  };
}

export function LeadOverview({
  lead,
  isSaving,
  isUpdatingStatus,
  isDeleting,
  error,
  onSave,
  onStatusUpdate,
  onDelete,
}: LeadOverviewProps) {
  const [form, setForm] = useState<LeadEditForm>(() => buildForm(lead));
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [localError, setLocalError] = useState("");
  const cfg = STATUS_CONFIG[lead.status];

  useEffect(() => {
    setForm(buildForm(lead));
    setStatus(lead.status);
  }, [lead]);

  const set = (key: keyof LeadEditForm, value: string) => {
    setLocalError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    const fullName = form.full_name.trim();
    const email = form.email.trim();
    const company = form.company.trim();
    const rawValue = form.value.trim();
    const value = rawValue ? Number(rawValue) : null;

    if (!fullName || !email || !company) {
      setLocalError("Full name, email, and company are required.");
      return;
    }

    if (value !== null && (Number.isNaN(value) || value < 0)) {
      setLocalError("Value must be a non-negative number.");
      return;
    }

    await onSave({
      full_name: fullName,
      email,
      phone: form.phone.trim() || null,
      company,
      industry: form.industry.trim() || null,
      source: form.source.trim() || null,
      assigned_to: form.assigned_to.trim() || null,
      value,
    });
  };

  const displayError = localError || error;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Lead Information
          </p>
          <h2 className="text-base font-bold text-slate-900">Edit Lead</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          {[
            { key: "full_name" as const, label: "Full Name" },
            { key: "email" as const, label: "Email", type: "email" },
            { key: "phone" as const, label: "Phone" },
            { key: "company" as const, label: "Company" },
            { key: "industry" as const, label: "Industry" },
            { key: "source" as const, label: "Source" },
            { key: "assigned_to" as const, label: "Assigned To" },
            { key: "value" as const, label: "Deal Value (INR)", type: "number" },
          ].map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                {field.label}
              </span>
              <input
                type={field.type ?? "text"}
                value={form[field.key]}
                onChange={(event) => set(field.key, event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          {displayError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {displayError}
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Last updated {formatDateTime(lead.updated_at)}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Current Status
          </p>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${cfg.badge}`}>
              {STATUS_LABELS[lead.status]}
            </span>
            <p className="text-xl font-extrabold text-slate-900">
              {formatCurrency(leadValue(lead))}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Update Status
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as LeadStatus)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {STATUS_COLUMNS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => onStatusUpdate(status)}
            disabled={isUpdatingStatus || status === lead.status}
            className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdatingStatus ? "Updating..." : "Update Status"}
          </button>
        </section>

        <section className="rounded-2xl border border-red-100 bg-white px-6 py-5 shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
            Danger Zone
          </p>
          <p className="mb-4 text-sm text-slate-500">
            Delete this lead and return to the CRM board.
          </p>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isDeleting ? "Deleting..." : "Delete Lead"}
          </button>
        </section>
      </aside>
    </div>
  );
}

