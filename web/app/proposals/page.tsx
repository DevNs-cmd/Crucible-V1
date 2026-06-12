"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

type ProposalForm = {
  companyName: string;
  industry: string;
  servicesOffered: string;
  projectGoals: string;
  budgetRange: string;
  timeline: string;
};

type ProposalSection = {
  heading: string;
  body: string;
};

type Proposal = {
  title: string;
  preparedFor: string;
  generatedAt: string;
  sections: ProposalSection[];
  text: string;
};

const INITIAL_FORM: ProposalForm = {
  companyName: "",
  industry: "",
  servicesOffered: "",
  projectGoals: "",
  budgetRange: "",
  timeline: "",
};

const FORM_FIELDS: Array<{
  id: keyof ProposalForm;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  {
    id: "companyName",
    label: "Company Name",
    placeholder: "e.g. Nexara Capital",
  },
  {
    id: "industry",
    label: "Industry",
    placeholder: "e.g. FinTech, HealthTech, SaaS",
  },
  {
    id: "servicesOffered",
    label: "Services Offered",
    placeholder: "e.g. AI audit, CRM automation, reporting dashboard",
    multiline: true,
  },
  {
    id: "projectGoals",
    label: "Project Goals",
    placeholder: "Describe the business outcomes this proposal should support",
    multiline: true,
  },
  {
    id: "budgetRange",
    label: "Budget Range",
    placeholder: "e.g. $25,000 - $40,000",
  },
  {
    id: "timeline",
    label: "Timeline",
    placeholder: "e.g. 6 weeks",
  },
];

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback;
}

function buildProposal(form: ProposalForm): Proposal {
  const company = valueOrFallback(form.companyName, "Prospective Client");
  const industry = valueOrFallback(form.industry, "the target market");
  const services = valueOrFallback(
    form.servicesOffered,
    "strategic discovery, implementation planning, workflow automation, and performance reporting"
  );
  const goals = valueOrFallback(
    form.projectGoals,
    "improve operational visibility, reduce manual coordination, and create a scalable delivery workflow"
  );
  const budget = valueOrFallback(form.budgetRange, "To be confirmed after discovery");
  const timeline = valueOrFallback(form.timeline, "To be confirmed after project kickoff");
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const title = `${company} Proposal`;

  const sections: ProposalSection[] = [
    {
      heading: "Executive Summary",
      body: `${company} is seeking a focused engagement to support ${goals}. This proposal outlines a practical plan for delivering measurable improvements through ${services}.`,
    },
    {
      heading: "Company Overview",
      body: `${company} operates in ${industry}. The proposed work is structured to respect the company's current operating model while creating a clearer path from strategy to execution.`,
    },
    {
      heading: "Recommended Services",
      body: `Recommended services include ${services}. These services will be organized into clear workstreams with defined checkpoints, ownership, and review points.`,
    },
    {
      heading: "Project Scope",
      body: `The project scope will focus on discovery, solution design, implementation support, stakeholder review, and final handoff. The work will be guided by the stated goals: ${goals}.`,
    },
    {
      heading: "Estimated Timeline",
      body: `The estimated delivery timeline is ${timeline}. The schedule can be refined after kickoff once dependencies, stakeholder availability, and delivery milestones are confirmed.`,
    },
    {
      heading: "Budget Section",
      body: `The expected budget range is ${budget}. Final pricing should be confirmed after discovery and scope validation.`,
    },
    {
      heading: "Next Steps",
      body: "Recommended next steps are to confirm stakeholders, validate the project scope, agree on success metrics, and schedule a kickoff session.",
    },
  ];

  const text = [
    title,
    `Prepared for: ${company}`,
    `Prepared on: ${generatedAt}`,
    "",
    ...sections.flatMap((section) => [section.heading, section.body, ""]),
  ].join("\n");

  return {
    title,
    preparedFor: company,
    generatedAt,
    sections,
    text,
  };
}

export default function ProposalsPage() {
  const [form, setForm] = useState<ProposalForm>(INITIAL_FORM);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy Proposal");

  const updateField = (field: keyof ProposalForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateProposal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProposal(buildProposal(form));
    setCopyLabel("Copy Proposal");
  };

  const copyProposal = async () => {
    if (!proposal) return;

    try {
      await navigator.clipboard.writeText(proposal.text);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy failed");
    }

    window.setTimeout(() => setCopyLabel("Copy Proposal"), 1800);
  };

  const downloadProposal = () => {
    if (!proposal) return;

    const slug =
      proposal.preparedFor
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "proposal";
    const blob = new Blob([proposal.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slug}-proposal.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Crucible
          </span>
          <span className="text-slate-200 text-lg font-thin">/</span>
          <span className="text-sm font-semibold text-slate-800">
            Proposal Generator
          </span>
        </div>
        <nav className="flex items-center gap-3" aria-label="Proposal navigation">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-amber-600"
          >
            Dashboard
          </Link>
          <Link
            href="/crm"
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-amber-600"
          >
            CRM
          </Link>
        </nav>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-1">
              F3 Proposal Generator
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Client Proposal Builder
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate a polished proposal preview from structured client inputs.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Mode
            </p>
            <p className="text-sm font-semibold text-slate-700">Client-side only</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
          <form
            onSubmit={generateProposal}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                Input Form
              </p>
              <h2 className="text-base font-bold text-slate-900">
                Proposal Details
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {FORM_FIELDS.map((field) => (
                <label key={field.id} className="block">
                  <span className="block text-xs font-semibold text-slate-600 mb-1">
                    {field.label}
                  </span>
                  {field.multiline ? (
                    <textarea
                      value={form[field.id]}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full resize-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  ) : (
                    <input
                      value={form[field.id]}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors shadow-sm shadow-amber-200"
              >
                Generate Proposal
              </button>
            </div>
          </form>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                  Output
                </p>
                <h2 className="text-base font-bold text-slate-900">
                  Proposal Preview
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyProposal}
                  disabled={!proposal}
                  className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  {copyLabel}
                </button>
                <button
                  type="button"
                  onClick={downloadProposal}
                  disabled={!proposal}
                  className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  Download as Text
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              {proposal ? (
                <article className="space-y-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5">
                    <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-2">
                      Proposal Title
                    </p>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {proposal.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Prepared for {proposal.preparedFor} on {proposal.generatedAt}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {proposal.sections.map((section) => (
                      <section key={section.heading} className="py-4 first:pt-0 last:pb-0">
                        <h4 className="text-sm font-extrabold text-slate-900 mb-2">
                          {section.heading}
                        </h4>
                        <p className="text-sm leading-6 text-slate-600">
                          {section.body}
                        </p>
                      </section>
                    ))}
                  </div>
                </article>
              ) : (
                <div className="min-h-[520px] flex flex-col justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-2">
                    Awaiting Input
                  </p>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Your proposal preview will appear here.
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                    Fill in the client details and generate a proposal to preview,
                    copy, or download the formatted text.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
