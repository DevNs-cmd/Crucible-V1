"use client";

import Link from "next/link";
import { useState } from "react";

type Priority = "High" | "Medium" | "Low";
type Stage = "Discovery" | "Contacted" | "Proposal Sent" | "Closed / Won";

interface Lead {
  id: number;
  company: string;
  contact: string;
  value: number;
  priority: Priority;
  stage: Stage;
  tag: string;
  daysInStage: number;
  avatar: string;
}

const STAGES: Stage[] = ["Discovery", "Contacted", "Proposal Sent", "Closed / Won"];

const INITIAL_LEADS: Lead[] = [
  { id: 1, company: "Nirvana Capital", contact: "Priya Mehta", value: 3500000, priority: "High", stage: "Discovery", tag: "FinTech", daysInStage: 2, avatar: "NC" },
  { id: 2, company: "Arogya Health", contact: "Rajesh Iyer", value: 1550000, priority: "Medium", stage: "Discovery", tag: "HealthTech", daysInStage: 5, avatar: "AH" },
  { id: 3, company: "Vahanam Logistics", contact: "Ananya Reddy", value: 2600000, priority: "High", stage: "Contacted", tag: "Logistics", daysInStage: 3, avatar: "VL" },
  { id: 4, company: "Drishti Analytics", contact: "Karthik Subramaniam", value: 800000, priority: "Low", stage: "Contacted", tag: "SaaS", daysInStage: 8, avatar: "DA" },
  { id: 5, company: "Sankalp Media", contact: "Neha Joshi", value: 2000000, priority: "High", stage: "Contacted", tag: "Media", daysInStage: 1, avatar: "SM" },
  { id: 6, company: "Bhoomi Realty", contact: "Rohan Kapoor", value: 4700000, priority: "High", stage: "Proposal Sent", tag: "Real Estate", daysInStage: 4, avatar: "BR" },
  { id: 7, company: "Vidya EdTech", contact: "Maya Krishnan", value: 650000, priority: "Medium", stage: "Proposal Sent", tag: "EdTech", daysInStage: 6, avatar: "VE" },
  { id: 8, company: "Surya Energy", contact: "Aditya Verma", value: 7400000, priority: "High", stage: "Closed / Won", tag: "CleanEnergy", daysInStage: 0, avatar: "SE" },
  { id: 9, company: "Sahyog Consumer Goods", contact: "Lakshmi Nair", value: 1100000, priority: "Medium", stage: "Closed / Won", tag: "FMCG", daysInStage: 0, avatar: "SC" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string }> = {
  High: { label: "High", cls: "bg-red-50 text-red-700 border border-red-200" },
  Medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  Low: { label: "Low", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
};

const STAGE_CONFIG: Record<Stage, { dot: string; header: string }> = {
  Discovery: { dot: "bg-slate-400", header: "border-t-slate-400" },
  Contacted: { dot: "bg-amber-400", header: "border-t-amber-400" },
  "Proposal Sent": { dot: "bg-blue-400", header: "border-t-blue-400" },
  "Closed / Won": { dot: "bg-emerald-500", header: "border-t-emerald-500" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

interface AddLeadModalProps {
  onClose: () => void;
  onAdd: (lead: Omit<Lead, "id" | "daysInStage" | "avatar">) => void;
}

function AddLeadModal({ onClose, onAdd }: AddLeadModalProps) {
  const [form, setForm] = useState({
    company: "",
    contact: "",
    value: "",
    priority: "Medium" as Priority,
    stage: "Discovery" as Stage,
    tag: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.company || !form.contact) return;
    onAdd({ ...form, value: Number(form.value) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="px-7 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">CRM</p>
            <h2 className="text-lg font-extrabold text-slate-900">Add New Lead</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-7 py-5 space-y-4">
          {[
            { k: "company", label: "Company Name", placeholder: "e.g. Nirvana Capital" },
            { k: "contact", label: "Contact Person", placeholder: "e.g. Priya Mehta" },
            { k: "tag", label: "Industry Tag", placeholder: "e.g. FinTech, SaaS" },
            { k: "value", label: "Deal Value (INR)", placeholder: "e.g. 2500000", type: "number" },
          ].map(({ k, label, placeholder, type }) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type={type || "text"}
                placeholder={placeholder}
                value={(form as Record<string, string>)[k]}
                onChange={(e) => set(k, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pipeline Stage</label>
              <select
                value={form.stage}
                onChange={(e) => set("stage", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="px-7 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors shadow-sm shadow-amber-200"
          >
            Add Lead
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [showModal, setShowModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | "All">("All");
  const [search, setSearch] = useState("");

  const addLead = (data: Omit<Lead, "id" | "daysInStage" | "avatar">) => {
    const newLead: Lead = {
      ...data,
      id: Date.now(),
      daysInStage: 0,
      avatar: data.company.slice(0, 2).toUpperCase(),
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const moveLead = (id: number, dir: 1 | -1) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = STAGES.indexOf(l.stage);
        const next = STAGES[idx + dir];
        return next ? { ...l, stage: next, daysInStage: 0 } : l;
      })
    );
  };

  const filtered = leads.filter((l) => {
    const matchPriority = filterPriority === "All" || l.priority === filterPriority;
    const matchSearch =
      !search ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.toLowerCase().includes(search.toLowerCase()) ||
      l.tag.toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchSearch;
  });

  const totalPipeline = leads.reduce((s, l) => s + l.value, 0);
  const wonValue = leads.filter((l) => l.stage === "Closed / Won").reduce((s, l) => s + l.value, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onAdd={addLead} />}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">Crucible</span>
          <span className="text-slate-200 text-lg font-thin">/</span>
          <span className="text-sm font-semibold text-slate-800">CRM Pipeline</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-amber-600"
          >
            Dashboard
          </Link>
          <Link
            href="/proposals"
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-amber-600"
          >
            Proposals
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add Custom Lead
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-7">
        {/* Title + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-1">Lead Management</p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Business Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-1">F2 — Kanban account tracking across lifecycle stages</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Pipeline</p>
              <p className="text-xl font-extrabold text-slate-900">{fmt(totalPipeline)}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Won Value</p>
              <p className="text-xl font-extrabold text-emerald-600">{fmt(wonValue)}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Leads</p>
              <p className="text-xl font-extrabold text-slate-900">{leads.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search company, contact, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Priority:</span>
            {(["All", "High", "Medium", "Low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  filterPriority === p
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.stage === stage);
            const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
            const cfg = STAGE_CONFIG[stage];

            return (
              <div key={stage} className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-t-4 ${cfg.header}`}>
                {/* Column Header */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="text-sm font-extrabold text-slate-900">{stage}</span>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold pl-4">{fmt(stageValue)}</p>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3 min-h-[80px]">
                  {stageLeads.length === 0 && (
                    <div className="text-center py-6 text-slate-300 text-xs font-medium">No leads</div>
                  )}
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5 hover:border-amber-200 hover:shadow-sm transition-all group"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                            {lead.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{lead.company}</p>
                            <p className="text-[11px] text-slate-500">{lead.contact}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[lead.priority].cls}`}>
                          {lead.priority}
                        </span>
                      </div>

                      {/* Value */}
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-base font-extrabold text-slate-900">{fmt(lead.value)}</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                          {lead.tag}
                        </span>
                      </div>

                      {/* Days badge */}
                      {lead.daysInStage > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {lead.daysInStage}d in stage
                          {lead.daysInStage >= 7 && (
                            <span className="ml-1.5 text-amber-600 font-bold">· Follow-up needed</span>
                          )}
                        </p>
                      )}
                      {lead.stage === "Closed / Won" && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ Deal closed</p>
                      )}

                      {/* Move buttons */}
                      <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {STAGES.indexOf(stage) > 0 && (
                          <button
                            onClick={() => moveLead(lead.id, -1)}
                            className="flex-1 text-[11px] font-semibold py-1 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            ← Back
                          </button>
                        )}
                        {STAGES.indexOf(stage) < STAGES.length - 1 && (
                          <button
                            onClick={() => moveLead(lead.id, 1)}
                            className="flex-1 text-[11px] font-semibold py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            Advance →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add inline CTA */}
                <div className="px-3 pb-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full text-xs font-semibold text-slate-400 hover:text-amber-600 py-2 border border-dashed border-slate-200 hover:border-amber-300 rounded-xl transition-colors"
                  >
                    + Add lead here
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pipeline Summary Footer */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
          <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-4">Pipeline Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STAGES.map((stage) => {
              const sl = leads.filter((l) => l.stage === stage);
              const sv = sl.reduce((s, l) => s + l.value, 0);
              const pct = totalPipeline > 0 ? (sv / totalPipeline) * 100 : 0;
              const cfg = STAGE_CONFIG[stage];
              return (
                <div key={stage}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-xs font-bold text-slate-700">{stage}</span>
                  </div>
                  <p className="text-lg font-extrabold text-slate-900 mb-1">{fmt(sv)}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${cfg.dot}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{sl.length} leads · {pct.toFixed(0)}% of pipeline</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
