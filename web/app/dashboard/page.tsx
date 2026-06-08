"use client";

import { useState, useEffect, useRef } from "react";

const METRIC_CARDS = [
  {
    label: "Total Pipeline Value",
    value: "$2,847,500",
    delta: "+12.4%",
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "amber",
  },
  {
    label: "Active AI Agents",
    value: "7",
    delta: "+2 this week",
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4M8 15h.01M16 15h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "navy",
  },
  {
    label: "CRM Leads Tracked",
    value: "341",
    delta: "+28 this week",
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "amber",
  },
  {
    label: "System Health Rate",
    value: "99.2%",
    delta: "All systems nominal",
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "green",
  },
];

const SPRINT_TASKS = [
  { id: 1, label: "Supabase schema migration — leads table", tag: "B1", done: true },
  { id: 2, label: "REST API route mapping (F1 ↔ B1 endpoints)", tag: "F1", done: true },
  { id: 3, label: "Authentication middleware integration", tag: "B1", done: true },
  { id: 4, label: "Dashboard metric aggregation queries", tag: "F1", done: false },
  { id: 5, label: "Lead status enum sync (frontend ↔ DB)", tag: "B1", done: false },
  { id: 6, label: "Notes system API wiring", tag: "B1", done: false },
  { id: 7, label: "n8n webhook receiver endpoint", tag: "Auto", done: false },
  { id: 8, label: "Admin analytics aggregation pipeline", tag: "B4", done: false },
  { id: 9, label: "Mobile responsiveness audit pass", tag: "F4", done: false },
  { id: 10, label: "Full integration smoke test", tag: "QA", done: false },
];

const INITIAL_LOGS = [
  { ts: "09:00:01", level: "INFO", message: "Server initialized on port 4000" },
  { ts: "09:00:03", level: "INFO", message: "Supabase connection established — pool size: 10" },
  { ts: "09:00:05", level: "INFO", message: "Running DB migration: 001_create_leads_table.sql" },
  { ts: "09:00:07", level: "SUCCESS", message: "Migration 001 applied successfully" },
  { ts: "09:00:12", level: "INFO", message: "Loading API route manifest from /routes/index.ts" },
  { ts: "09:00:14", level: "INFO", message: "Registered 14 REST endpoints across 4 modules" },
  { ts: "09:00:18", level: "WARN", message: "Rate limiter: threshold not set for /api/audit — defaulting to 60 req/min" },
  { ts: "09:00:22", level: "INFO", message: "AI Audit Generator service connected on socket :8080" },
  { ts: "09:00:30", level: "INFO", message: "n8n webhook listener active — /webhooks/crm-trigger" },
  { ts: "09:00:45", level: "SUCCESS", message: "CRM Backend health check passed ✓" },
];

const NEW_LOG_POOL = [
  { level: "INFO", message: "Lead #341 ingested via API — source: web form" },
  { level: "INFO", message: "Email automation triggered for lead #338 — template: follow_up_v2" },
  { level: "SUCCESS", message: "Proposal generated for Acme Corp — 8 pages, PDF exported" },
  { level: "INFO", message: "Status tracking cron ran — 12 leads updated" },
  { level: "WARN", message: "Lead #302 follow-up overdue by 3 days — escalation queued" },
  { level: "INFO", message: "Admin analytics snapshot saved — 2026-06-08T09:15:00Z" },
  { level: "SUCCESS", message: "AI Audit report completed for FinTech client — score: 87/100" },
  { level: "INFO", message: "Supabase real-time listener received UPDATE on leads table" },
];

type Log = { ts: string; level: string; message: string };

function getNow() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState(SPRINT_TASKS);
  const [logs, setLogs] = useState<Log[]>(INITIAL_LOGS);
  const logRef = useRef<HTMLDivElement>(null);
  const [logIdx, setLogIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const entry = NEW_LOG_POOL[logIdx % NEW_LOG_POOL.length];
      setLogs((prev) => [
        ...prev.slice(-49),
        { ts: getNow(), level: entry.level, message: entry.message },
      ]);
      setLogIdx((i) => i + 1);
    }, 3200);
    return () => clearInterval(interval);
  }, [logIdx]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  const levelColor: Record<string, string> = {
    INFO: "text-slate-400",
    SUCCESS: "text-emerald-500",
    WARN: "text-amber-500",
    ERROR: "text-red-500",
  };

  const tagColor: Record<string, string> = {
    B1: "bg-slate-100 text-slate-600",
    F1: "bg-amber-50 text-amber-700 border border-amber-200",
    Auto: "bg-blue-50 text-blue-700",
    B4: "bg-slate-100 text-slate-600",
    F4: "bg-amber-50 text-amber-700 border border-amber-200",
    QA: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 px-8 py-0 flex items-center justify-between h-14 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">Crucible</span>
          <span className="text-slate-200 text-lg font-thin">/</span>
          <span className="text-sm font-semibold text-slate-800">Dev Operations</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Week 1 Sprint</span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            All Systems Operational
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-amber-600 uppercase mb-1">Executive Dashboard</p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Platform Control Panel
            </h1>
            <p className="text-sm text-slate-500 mt-1">AlgoForce AI — Internal Infrastructure · Week 1 Objective</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Last refreshed</p>
            <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleString("en-GB")}</p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {METRIC_CARDS.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`p-2 rounded-xl ${
                    card.accent === "amber"
                      ? "bg-amber-50 text-amber-600"
                      : card.accent === "green"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {card.icon}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    card.positive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {card.delta}
                </span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle row: Sprint Checklist + Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sprint Priority Checklist */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">Week 1</p>
                <h2 className="text-base font-bold text-slate-900">Sprint Priority Checklist</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Progress</p>
                <p className="text-lg font-extrabold text-amber-600">{done}/{tasks.length}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-slate-100">
              <div
                className="h-1 bg-amber-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-3 group text-left"
                >
                  <span
                    className={`w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      task.done
                        ? "bg-amber-500 border-amber-500"
                        : "border-slate-300 group-hover:border-amber-400"
                    }`}
                  >
                    {task.done && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`flex-1 text-sm transition-colors ${
                      task.done ? "line-through text-slate-400" : "text-slate-700"
                    }`}
                  >
                    {task.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      tagColor[task.tag] || "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {task.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Activity Log */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 pt-5 pb-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">Real-time</p>
                <h2 className="text-base font-bold text-slate-100">System Activity Log</h2>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-1 font-mono text-xs max-h-80"
            >
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 items-start leading-relaxed">
                  <span className="text-slate-600 flex-shrink-0 tabular-nums">{log.ts}</span>
                  <span className={`font-bold flex-shrink-0 w-14 ${levelColor[log.level] || "text-slate-400"}`}>
                    {log.level}
                  </span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integration Status Strip */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
          <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-3">Integration Layer</p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Frontend ↔ Backend", detail: "REST APIs", ok: true },
              { label: "Real-time Sync", detail: "Supabase / Firebase", ok: true },
              { label: "Webhook Automation", detail: "n8n webhooks", ok: true },
              { label: "Auth Service", detail: "JWT middleware", ok: true },
              { label: "AI Audit API", detail: "Socket :8080", ok: true },
              { label: "Email Automation", detail: "n8n sequences", ok: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${item.ok ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                <span className="text-[11px] text-slate-400 font-mono">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Deliverables Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: "F1+F4", title: "Dashboard UI", sub: "5 pages", color: "amber" },
            { id: "F2+F3", title: "Lead Mgmt UI", sub: "+ Proposal Gen.", color: "amber" },
            { id: "B1", title: "CRM Backend", sub: "APIs + Auth + DB", color: "slate" },
            { id: "B2+B3+B4", title: "AI Audit API", sub: "+ Auto. System", color: "slate" },
          ].map((d) => (
            <div
              key={d.id}
              className={`rounded-2xl px-5 py-4 border ${
                d.color === "amber"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <p
                className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${
                  d.color === "amber" ? "text-amber-600" : "text-slate-500"
                }`}
              >
                {d.id}
              </p>
              <p className="text-sm font-extrabold text-slate-900">{d.title}</p>
              <p className="text-xs text-slate-500">{d.sub}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}