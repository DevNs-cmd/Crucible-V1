"use client";

import { useState } from "react";
import type { CreateLeadInput, LeadStatus } from "@/app/lib/api";
import { STATUS_COLUMNS } from "@/app/lib/crm";

type LeadForm = {
  full_name: string;
  email: string;
  company: string;
  industry: string;
  value: string;
  status: LeadStatus;
};

interface AddLeadModalProps {
  initialStatus: LeadStatus;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onAdd: (lead: CreateLeadInput) => Promise<void>;
}

export function AddLeadModal({
  initialStatus,
  isSaving,
  error,
  onClose,
  onAdd,
}: AddLeadModalProps) {
  const [form, setForm] = useState<LeadForm>({
    full_name: "",
    email: "",
    company: "",
    industry: "",
    value: "",
    status: initialStatus,
  });
  const [localError, setLocalError] = useState("");

  const set = (key: keyof LeadForm, value: string) => {
    setLocalError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    const fullName = form.full_name.trim();
    const email = form.email.trim();
    const company = form.company.trim();
    const industry = form.industry.trim();
    const rawValue = form.value.trim();
    const value = rawValue ? Number(rawValue) : undefined;

    if (!fullName) {
      setLocalError("Full name is required.");
      return;
    }

    if (value !== undefined && (Number.isNaN(value) || value < 0)) {
      setLocalError("Value must be a non-negative number.");
      return;
    }

    await onAdd({
      full_name: fullName,
      email: email || undefined,
      company: company || undefined,
      industry: industry || undefined,
      value,
      status: form.status,
    });
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-7 pb-5 pt-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
              CRM
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">Add New Lead</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-700"
            aria-label="Close add lead dialog"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-7 py-5">
          {[
            {
              key: "full_name" as const,
              label: "Full Name",
              placeholder: "e.g. Priya Mehta",
            },
            {
              key: "email" as const,
              label: "Email",
              placeholder: "e.g. priya@example.com",
              type: "email",
            },
            {
              key: "company" as const,
              label: "Company",
              placeholder: "e.g. Nexara Capital",
            },
            {
              key: "industry" as const,
              label: "Industry",
              placeholder: "e.g. FinTech, SaaS",
            },
            {
              key: "value" as const,
              label: "Deal Value (INR)",
              placeholder: "e.g. 250000",
              type: "number",
            },
          ].map(({ key, label, placeholder, type }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                {label}
              </span>
              <input
                type={type || "text"}
                placeholder={placeholder}
                value={form[key]}
                onChange={(event) => set(key, event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) => set("status", event.target.value as LeadStatus)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {STATUS_COLUMNS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          {displayError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {displayError}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-7 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {isSaving ? "Adding..." : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

