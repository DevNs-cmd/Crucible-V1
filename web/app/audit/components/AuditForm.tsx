"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { AuditGenerateInput, BudgetTier } from "@/app/lib/api";

type AuditFormState = {
  companyName: string;
  industry: string;
  companyType: string;
  companySize: string;
  problemsText: string;
  currentToolsText: string;
  budget: string;
};

const INITIAL_FORM: AuditFormState = {
  companyName: "",
  industry: "",
  companyType: "",
  companySize: "",
  problemsText: "",
  currentToolsText: "",
  budget: "",
};

const BUDGET_OPTIONS: Array<{ value: BudgetTier; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

interface AuditFormProps {
  isLoading: boolean;
  onSubmit: (input: AuditGenerateInput) => Promise<void>;
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

export function AuditForm({ isLoading, onSubmit }: AuditFormProps) {
  const [form, setForm] = useState<AuditFormState>(INITIAL_FORM);
  const [error, setError] = useState("");

  const set = (key: keyof AuditFormState, value: string) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const budget = form.budget.trim();
    if (!isBudgetTier(budget)) {
      setError("Select a valid budget before generating the audit.");
      return;
    }

    const input: AuditGenerateInput = {
      companyName: form.companyName.trim(),
      industry: form.industry.trim(),
      companyType: form.companyType.trim(),
      companySize: form.companySize.trim(),
      problems: splitList(form.problemsText),
      currentTools: splitList(form.currentToolsText),
      budget,
    };

    if (
      !input.companyName ||
      !input.industry ||
      !input.companyType ||
      !input.companySize ||
      input.problems.length === 0 ||
      !input.budget
    ) {
      setError("Complete the required fields before generating the audit.");
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
          Audit Input
        </p>
        <h2 className="text-base font-bold text-slate-900">Company Profile</h2>
      </div>
      <div className="space-y-4 px-6 py-5">
        {[
          { key: "companyName" as const, label: "Company Name", placeholder: "e.g., AlgoForce AI" },
          { key: "industry" as const, label: "Industry", placeholder: "e.g., Technology, Healthcare, Finance" },
          { key: "companyType" as const, label: "Company Type", placeholder: "e.g., SaaS, Consulting, Manufacturing" },
          { key: "companySize" as const, label: "Company Size", placeholder: "e.g., 50-100 employees, 500+ employees" },
        ].map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              {field.label}
            </span>
            <input
              value={form[field.key]}
              onChange={(event) => set(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
        ))}

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

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Problems
          </span>
          <textarea
            value={form.problemsText}
            onChange={(event) => set("problemsText", event.target.value)}
            rows={5}
            placeholder="One problem per line, or comma separated"
            className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Current Tools
          </span>
          <textarea
            value={form.currentToolsText}
            onChange={(event) => set("currentToolsText", event.target.value)}
            rows={5}
            placeholder="One tool per line, or comma separated"
            className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
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
          {isLoading ? "Generating..." : "Generate Audit"}
        </button>
      </div>
    </form>
  );
}

