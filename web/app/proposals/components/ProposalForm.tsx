"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { BudgetTier, ProposalGenerateInput } from "@/app/lib/api";

type ProposalFormState = {
  companyName: string;
  industry: string;
  servicesText: string;
  problems: string;
  budget: string;
  contactName: string;
  contactEmail: string;
};

const INITIAL_FORM: ProposalFormState = {
  companyName: "",
  industry: "",
  servicesText: "",
  problems: "",
  budget: "",
  contactName: "",
  contactEmail: "",
};

const BUDGET_OPTIONS: Array<{ value: BudgetTier; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

interface ProposalFormProps {
  isLoading: boolean;
  onSubmit: (input: ProposalGenerateInput) => Promise<void>;
}

function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isBudgetTier(value: string): value is BudgetTier {
  return BUDGET_OPTIONS.some((option) => option.value === value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ProposalForm({ isLoading, onSubmit }: ProposalFormProps) {
  const [form, setForm] = useState<ProposalFormState>(INITIAL_FORM);
  const [error, setError] = useState("");

  const set = (key: keyof ProposalFormState, value: string) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const budget = form.budget.trim();
    if (!isBudgetTier(budget)) {
      setError("Select a valid budget before generating the proposal.");
      return;
    }

    const contactEmail = form.contactEmail.trim();
    if (contactEmail && !isValidEmail(contactEmail)) {
      setError("Contact email must be a valid email address.");
      return;
    }

    const input: ProposalGenerateInput = {
      companyName: form.companyName.trim(),
      industry: form.industry.trim(),
      servicesRequired: splitList(form.servicesText),
      problems: form.problems.trim(),
      budget,
      contactName: form.contactName.trim() || undefined,
      contactEmail: contactEmail || undefined,
    };

    if (
      !input.companyName ||
      !input.industry ||
      input.servicesRequired.length === 0 ||
      !input.problems
    ) {
      setError("Complete the required fields before generating the proposal.");
      return;
    }

    await onSubmit(input);
  };

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Proposal Input
        </p>
        <h2 className="text-base font-bold text-slate-900">Client Scope</h2>
      </div>
      <div className="space-y-4 px-6 py-5">
        {[
          { key: "companyName" as const, label: "Company Name" },
          { key: "industry" as const, label: "Industry" },
          { key: "contactName" as const, label: "Contact Name" },
          { key: "contactEmail" as const, label: "Contact Email", type: "email" },
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

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Services Required
          </span>
          <textarea
            value={form.servicesText}
            onChange={(event) => set("servicesText", event.target.value)}
            rows={4}
            placeholder="One service per line, or comma separated"
            className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Problems To Solve
          </span>
          <textarea
            value={form.problems}
            onChange={(event) => set("problems", event.target.value)}
            rows={5}
            className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Budget
          </span>
          <select
            value={form.budget}
            onChange={(event) => set("budget", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Select budget</option>
            {BUDGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
      <div className="border-t border-slate-100 px-6 py-5">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
        >
          {isLoading ? "Generating..." : "Generate Proposal"}
        </button>
      </div>
    </form>
  );
}
