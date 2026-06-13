"use client";

import { useState } from "react";
import type { CreateMeetingInput, LeadMeeting } from "@/app/lib/api";
import { formatDateTime, getMeetingDate } from "@/app/lib/crm";

interface LeadMeetingsProps {
  meetings: LeadMeeting[];
  isSaving: boolean;
  onAdd: (meeting: CreateMeetingInput) => Promise<void>;
}

export function LeadMeetings({ meetings, isSaving, onAdd }: LeadMeetingsProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!title.trim() || !scheduledAt) {
      setError("Title and scheduled time are required.");
      return;
    }

    setError("");
    await onAdd({
      title: title.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setScheduledAt("");
    setLocation("");
    setNotes("");
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Meetings
          </p>
          <h2 className="text-base font-bold text-slate-900">Schedule Meeting</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Scheduled Time
            </span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Location
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
            {isSaving ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Calendar
          </p>
          <h2 className="text-base font-bold text-slate-900">Meetings</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {meetings.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400">No meetings scheduled.</p>
          ) : (
            meetings.map((meeting) => (
              <article key={meeting.id} className="px-6 py-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {meeting.title || "Meeting"}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      {formatDateTime(getMeetingDate(meeting))}
                    </p>
                  </div>
                  {meeting.location && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {meeting.location}
                    </span>
                  )}
                </div>
                {meeting.notes && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {meeting.notes}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

