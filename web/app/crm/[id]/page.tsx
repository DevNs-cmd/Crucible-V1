"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { LeadFollowups } from "@/app/crm/components/LeadFollowups";
import { LeadMeetings } from "@/app/crm/components/LeadMeetings";
import { LeadNotes } from "@/app/crm/components/LeadNotes";
import { LeadOverview } from "@/app/crm/components/LeadOverview";
import {
  apiRequest,
  type CreateFollowupInput,
  type CreateMeetingInput,
  type Lead,
  type LeadFollowup,
  type LeadMeeting,
  type LeadNote,
  type LeadStatus,
  type UpdateLeadInput,
} from "@/app/lib/api";
import {
  formatCurrency,
  getErrorMessage,
  getFollowupDate,
  getMeetingDate,
  isFollowupComplete,
  leadValue,
  STATUS_LABELS,
} from "@/app/lib/crm";
import { useAuth } from "@/app/providers/auth-provider";

type Tab = "overview" | "notes" | "meetings" | "followups";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "notes", label: "Notes" },
  { id: "meetings", label: "Meetings" },
  { id: "followups", label: "Follow-ups" },
];

function sortMeetings(meetings: LeadMeeting[]) {
  return [...meetings].sort((a, b) => {
    const aTime = new Date(getMeetingDate(a) ?? a.created_at).getTime();
    const bTime = new Date(getMeetingDate(b) ?? b.created_at).getTime();
    return aTime - bTime;
  });
}

function sortFollowups(followups: LeadFollowup[]) {
  return [...followups].sort((a, b) => {
    const aTime = new Date(getFollowupDate(a) ?? a.created_at).getTime();
    const bTime = new Date(getFollowupDate(b) ?? b.created_at).getTime();
    return aTime - bTime;
  });
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, status: authStatus } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [meetings, setMeetings] = useState<LeadMeeting[]>([]);
  const [followups, setFollowups] = useState<LeadFollowup[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [relatedError, setRelatedError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);
  const [updatingFollowupId, setUpdatingFollowupId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || !token || !id) return;

    let active = true;

    async function fetchLeadDetail() {
      setIsLoading(true);
      setLoadError("");
      setRelatedError("");

      try {
        const [leadResult, notesResult, meetingsResult, followupsResult] =
          await Promise.allSettled([
            apiRequest<Lead>(`/leads/${id}`, { token }),
            apiRequest<LeadNote[]>(`/leads/${id}/notes`, { token }),
            apiRequest<LeadMeeting[]>(`/leads/${id}/meetings`, { token }),
            apiRequest<LeadFollowup[]>(`/leads/${id}/followups`, { token }),
          ]);

        if (!active) return;

        if (leadResult.status === "rejected") {
          throw leadResult.reason;
        }

        setLead(leadResult.value);
        setNotes(
          notesResult.status === "fulfilled"
            ? [...notesResult.value].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            : []
        );
        setMeetings(
          meetingsResult.status === "fulfilled" ? sortMeetings(meetingsResult.value) : []
        );
        setFollowups(
          followupsResult.status === "fulfilled"
            ? sortFollowups(followupsResult.value)
            : []
        );

        if (
          notesResult.status === "rejected" ||
          meetingsResult.status === "rejected" ||
          followupsResult.status === "rejected"
        ) {
          setRelatedError("Some related CRM activity could not be loaded.");
        }
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchLeadDetail();

    return () => {
      active = false;
    };
  }, [authStatus, id, token]);

  const openFollowups = useMemo(
    () => followups.filter((followup) => !isFollowupComplete(followup)).length,
    [followups]
  );

  const saveLead = async (input: UpdateLeadInput) => {
    if (!token || !lead) return;

    setIsSavingLead(true);
    setSaveError("");

    try {
      const updated = await apiRequest<Lead>(`/leads/${lead.id}`, {
        method: "PUT",
        token,
        body: input,
      });
      setLead(updated);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsSavingLead(false);
    }
  };

  const updateStatus = async (status: LeadStatus) => {
    if (!token || !lead || status === lead.status) return;

    setIsUpdatingStatus(true);
    setSaveError("");

    try {
      const updated = await apiRequest<Lead>(`/leads/${lead.id}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      setLead(updated);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const deleteLead = async () => {
    if (!token || !lead) return;
    if (!window.confirm(`Delete ${lead.company}? This cannot be undone.`)) return;

    setIsDeleting(true);
    setSaveError("");

    try {
      await apiRequest<null>(`/leads/${lead.id}`, {
        method: "DELETE",
        token,
      });
      router.replace("/crm");
    } catch (err) {
      setSaveError(getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const addNote = async (content: string) => {
    if (!token || !lead) return;

    setIsSavingNote(true);
    try {
      const note = await apiRequest<LeadNote>(`/leads/${lead.id}/notes`, {
        method: "POST",
        token,
        body: { content },
      });
      setNotes((prev) => [note, ...prev]);
    } finally {
      setIsSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!token || !lead) return;

    await apiRequest<null>(`/leads/${lead.id}/notes/${noteId}`, {
      method: "DELETE",
      token,
    });
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const addMeeting = async (meeting: CreateMeetingInput) => {
    if (!token || !lead) return;

    setIsSavingMeeting(true);
    try {
      const created = await apiRequest<LeadMeeting>(`/leads/${lead.id}/meetings`, {
        method: "POST",
        token,
        body: meeting,
      });
      setMeetings((prev) => sortMeetings([...prev, created]));
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const addFollowup = async (followup: CreateFollowupInput) => {
    if (!token || !lead) return;

    setIsSavingFollowup(true);
    try {
      const created = await apiRequest<LeadFollowup>(`/leads/${lead.id}/followups`, {
        method: "POST",
        token,
        body: followup,
      });
      setFollowups((prev) => sortFollowups([...prev, created]));
    } finally {
      setIsSavingFollowup(false);
    }
  };

  const toggleFollowup = async (followup: LeadFollowup) => {
    if (!token || !lead) return;

    const completed = !isFollowupComplete(followup);
    setUpdatingFollowupId(followup.id);

    try {
      const updated = await apiRequest<LeadFollowup>(
        `/leads/${lead.id}/followups/${followup.id}`,
        {
          method: "PATCH",
          token,
          body: {
            completed,
            status: completed ? "completed" : "open",
          },
        }
      );
      setFollowups((prev) =>
        sortFollowups(prev.map((item) => (item.id === followup.id ? updated : item)))
      );
    } finally {
      setUpdatingFollowupId(null);
    }
  };

  return (
    <AppShell section="Lead Detail">
      <main className="mx-auto max-w-[1400px] space-y-7 px-6 py-8">
        <PageHeader
          eyebrow="CRM Detail"
          title={lead ? lead.company : "Lead Detail"}
          description={
            lead
              ? `${lead.full_name} - ${lead.email}`
              : "Review and update the selected lead."
          }
          aside={
            <Link
              href="/crm"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-700"
            >
              Back to CRM
            </Link>
          }
        />

        {isLoading && (
          <p className="rounded-2xl border border-slate-100 bg-white px-6 py-5 text-sm font-semibold text-slate-400 shadow-sm">
            Loading lead...
          </p>
        )}

        {loadError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-semibold text-red-700">
            {loadError}
          </p>
        )}

        {lead && (
          <>
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Status", value: STATUS_LABELS[lead.status] },
                { label: "Deal Value", value: formatCurrency(leadValue(lead)) },
                { label: "Notes", value: String(notes.length) },
                { label: "Open Follow-ups", value: String(openFollowups) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </section>

            {relatedError && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                {relatedError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <LeadOverview
                lead={lead}
                isSaving={isSavingLead}
                isUpdatingStatus={isUpdatingStatus}
                isDeleting={isDeleting}
                error={saveError}
                onSave={saveLead}
                onStatusUpdate={updateStatus}
                onDelete={deleteLead}
              />
            )}
            {activeTab === "notes" && (
              <LeadNotes
                notes={notes}
                isSaving={isSavingNote}
                onAdd={addNote}
                onDelete={deleteNote}
              />
            )}
            {activeTab === "meetings" && (
              <LeadMeetings
                meetings={meetings}
                isSaving={isSavingMeeting}
                onAdd={addMeeting}
              />
            )}
            {activeTab === "followups" && (
              <LeadFollowups
                followups={followups}
                isSaving={isSavingFollowup}
                updatingId={updatingFollowupId}
                onAdd={addFollowup}
                onToggle={toggleFollowup}
              />
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

