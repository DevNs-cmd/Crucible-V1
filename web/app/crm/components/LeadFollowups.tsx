"use client";

import { useState } from "react";
import type { CreateFollowupInput, LeadFollowup } from "@/app/lib/api";
import {
  formatShortDate,
  getFollowupDate,
  isFollowupComplete,
} from "@/app/lib/crm";

interface LeadFollowupsProps {
  followups: LeadFollowup[];
  isSaving: boolean;
  updatingId: string | null;
  onAdd: (followup: CreateFollowupInput) => Promise<void>;
  onToggle: (followup: LeadFollowup) => Promise<void>;
}

export function LeadFollowups({
  followups,
  isSaving,
  updatingId,
  onAdd,
  onToggle,
}: LeadFollowupsProps) {
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!description.trim() || !dueDate) {
      setError("Description and due date are required.");
      return;
    }

    setError("");
    try {
      await onAdd({
        description: description.trim(),
        due_at: new Date(dueDate).toISOString(),
      });
      setDescription("");
      setDueDate("");
    } catch {
      setError("Unable to create follow-up. Please try again.");
    }
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Follow-ups
          </p>
          <h2 className="text-base font-bold text-slate-900">Create Follow-up</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Description
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Due Date
            </span>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {isSaving ? "Creating..." : "Create Follow-up"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Tasks
          </p>
          <h2 className="text-base font-bold text-slate-900">Follow-ups</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {followups.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400">No follow-ups yet.</p>
          ) : (
            followups.map((followup) => {
              const complete = isFollowupComplete(followup);

              return (
                <article key={followup.id} className="px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3
                        className={`text-sm font-extrabold ${
                          complete ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {followup.description}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Due {formatShortDate(getFollowupDate(followup))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggle(followup)}
                      disabled={updatingId === followup.id || complete}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        complete
                          ? "border border-slate-200 text-slate-500 hover:bg-slate-50"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {complete ? "Done" : "Mark Done"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

