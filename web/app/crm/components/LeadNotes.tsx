"use client";

import { useState } from "react";
import type { LeadNote } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/crm";

interface LeadNotesProps {
  notes: LeadNote[];
  isSaving: boolean;
  onAdd: (content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export function LeadNotes({ notes, isSaving, onAdd, onDelete }: LeadNotesProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    const value = content.trim();
    if (!value) {
      setError("Write a note before saving.");
      return;
    }

    setError("");
    try {
      await onAdd(value);
      setContent("");
    } catch {
      setError("Unable to save note. Please try again.");
    }
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Notes
          </p>
          <h2 className="text-base font-bold text-slate-900">Add Note</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <textarea
            value={content}
            onChange={(event) => {
              setError("");
              setContent(event.target.value);
            }}
            rows={8}
            placeholder="Capture the conversation, next step, or decision..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
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
            {isSaving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            History
          </p>
          <h2 className="text-base font-bold text-slate-900">Lead Notes</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {notes.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="px-6 py-5">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <p className="text-xs font-semibold text-slate-400">
                    {formatDateTime(note.created_at)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDelete(note.id)}
                    className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {note.content}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

