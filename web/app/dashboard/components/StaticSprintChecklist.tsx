"use client";

import { useState } from "react";

// Static placeholder: backend endpoint not yet available
const SPRINT_TASKS = [
  { id: 1, label: "Supabase schema migration - leads table", tag: "B1", done: true },
  { id: 2, label: "REST API route mapping for CRM endpoints", tag: "F1", done: true },
  { id: 3, label: "Authentication middleware integration", tag: "B1", done: true },
  { id: 4, label: "Dashboard metric aggregation queries", tag: "F1", done: false },
  { id: 5, label: "Lead status enum sync", tag: "B1", done: false },
  { id: 6, label: "Notes system API wiring", tag: "B1", done: false },
  { id: 7, label: "Webhook receiver endpoint", tag: "Auto", done: false },
  { id: 8, label: "Admin analytics aggregation pipeline", tag: "B4", done: false },
  { id: 9, label: "Mobile responsiveness audit pass", tag: "F4", done: false },
  { id: 10, label: "Full integration smoke test", tag: "QA", done: false },
];

const TAG_COLOR: Record<string, string> = {
  B1: "bg-slate-100 text-slate-600",
  F1: "bg-amber-50 text-amber-700 border border-amber-200",
  Auto: "bg-blue-50 text-blue-700",
  B4: "bg-slate-100 text-slate-600",
  F4: "bg-amber-50 text-amber-700 border border-amber-200",
  QA: "bg-emerald-50 text-emerald-700",
};

export function StaticSprintChecklist() {
  const [tasks, setTasks] = useState(SPRINT_TASKS);
  const done = tasks.filter((task) => task.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 pb-4 pt-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Week 1
          </p>
          <h2 className="text-base font-bold text-slate-900">
            Sprint Priority Checklist
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Progress</p>
          <p className="text-lg font-extrabold text-amber-600">
            {done}/{tasks.length}
          </p>
        </div>
      </div>
      <div className="h-1 bg-slate-100">
        <div className="h-1 bg-amber-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto px-6 py-4">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
            className="group flex w-full items-center gap-3 text-left"
          >
            <span
              className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                task.done
                  ? "border-amber-500 bg-amber-500"
                  : "border-slate-300 group-hover:border-amber-400"
              }`}
            >
              {task.done && (
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={`flex-1 text-sm transition-colors ${
                task.done ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {task.label}
            </span>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                TAG_COLOR[task.tag] || "bg-slate-100 text-slate-500"
              }`}
            >
              {task.tag}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

