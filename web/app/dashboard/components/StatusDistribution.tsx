import type { LeadsByStatus } from "@/app/lib/api";
import { STATUS_COLUMNS, STATUS_CONFIG } from "@/app/lib/crm";

interface StatusDistributionProps {
  statusCounts: LeadsByStatus[];
}

export function StatusDistribution({ statusCounts }: StatusDistributionProps) {
  const countByStatus = new Map(statusCounts.map((item) => [item.status, item.count]));
  const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Lead Status Distribution
        </p>
        <h2 className="text-base font-bold text-slate-900">Pipeline Shape</h2>
      </div>
      <div className="space-y-4">
        {STATUS_COLUMNS.map((status) => {
          const count = countByStatus.get(status.value) ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const cfg = STATUS_CONFIG[status.value];

          return (
            <div key={status.value}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-sm font-bold text-slate-700">{status.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {count} leads
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${cfg.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {total === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            No leads available yet.
          </p>
        )}
      </div>
    </section>
  );
}

