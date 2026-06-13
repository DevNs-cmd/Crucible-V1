import Link from "next/link";
import type { DashboardFollowup } from "@/app/dashboard/components/dashboard-types";
import {
  formatShortDate,
  getFollowupDate,
  isFollowupComplete,
} from "@/app/lib/crm";

interface FollowupsWidgetProps {
  followups: DashboardFollowup[];
}

export function FollowupsWidget({ followups }: FollowupsWidgetProps) {
  const now = Date.now();
  const due = followups
    .filter((followup) => !isFollowupComplete(followup))
    .sort((a, b) => {
      const aTime = new Date(getFollowupDate(a) ?? a.created_at).getTime();
      const bTime = new Date(getFollowupDate(b) ?? b.created_at).getTime();
      return aTime - bTime;
    })
    .slice(0, 6);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Follow-ups Due
        </p>
        <h2 className="text-base font-bold text-slate-900">Open Next Steps</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {due.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No open follow-ups.</p>
        ) : (
          due.map((followup) => {
            const time = new Date(getFollowupDate(followup) ?? "").getTime();
            const overdue = Number.isFinite(time) && time < now;

            return (
              <Link
                key={`${followup.leadId}-${followup.id}`}
                href={`/crm/${followup.leadId}`}
                className="block px-6 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {followup.title || "Follow-up"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {followup.leadCompany}
                    </p>
                  </div>
                  <p
                    className={`text-right text-xs font-semibold ${
                      overdue ? "text-red-500" : "text-slate-400"
                    }`}
                  >
                    {formatShortDate(getFollowupDate(followup))}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

