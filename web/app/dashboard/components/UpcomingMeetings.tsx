import Link from "next/link";
import type { DashboardMeeting } from "@/app/dashboard/components/dashboard-types";
import { formatDateTime, getMeetingDate } from "@/app/lib/crm";

interface UpcomingMeetingsProps {
  meetings: DashboardMeeting[];
}

export function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  const now = Date.now();
  const upcoming = meetings
    .filter((meeting) => {
      const time = new Date(getMeetingDate(meeting) ?? "").getTime();
      return Number.isFinite(time) && time >= now;
    })
    .sort(
      (a, b) =>
        new Date(getMeetingDate(a) ?? "").getTime() -
        new Date(getMeetingDate(b) ?? "").getTime()
    )
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Upcoming Meetings
        </p>
        <h2 className="text-base font-bold text-slate-900">Scheduled Next</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {upcoming.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No upcoming meetings.</p>
        ) : (
          upcoming.map((meeting) => (
            <Link
              key={`${meeting.leadId}-${meeting.id}`}
              href={`/crm/${meeting.leadId}`}
              className="block px-6 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {meeting.title || "Meeting"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {meeting.leadCompany}
                  </p>
                </div>
                <p className="text-right text-xs font-semibold text-slate-400">
                  {formatDateTime(getMeetingDate(meeting))}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

