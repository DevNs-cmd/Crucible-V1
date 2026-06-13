import Link from "next/link";
import type { Lead } from "@/app/lib/api";
import { formatCurrency, formatDateTime, leadValue, STATUS_LABELS } from "@/app/lib/crm";

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  const recent = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Recent Leads
        </p>
        <h2 className="text-base font-bold text-slate-900">Latest CRM Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No leads available yet.</p>
        ) : (
          recent.map((lead) => (
            <Link
              key={lead.id}
              href={`/crm/${lead.id}`}
              className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{lead.company}</p>
                <p className="truncate text-xs text-slate-500">{lead.full_name}</p>
                <p className="text-[11px] text-slate-400">
                  {formatDateTime(lead.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(leadValue(lead))}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  {STATUS_LABELS[lead.status]}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

