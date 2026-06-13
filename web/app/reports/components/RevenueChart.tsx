import type { Lead } from "@/app/lib/api";
import {
  formatCurrency,
  leadValue,
  STATUS_COLUMNS,
  STATUS_CONFIG,
} from "@/app/lib/crm";

interface RevenueChartProps {
  leads: Lead[];
}

export function RevenueChart({ leads }: RevenueChartProps) {
  const rows = STATUS_COLUMNS.map((status) => {
    const statusLeads = leads.filter((lead) => lead.status === status.value);
    return {
      ...status,
      count: statusLeads.length,
      revenue: statusLeads.reduce((sum, lead) => sum + leadValue(lead), 0),
    };
  });
  const max = Math.max(...rows.map((row) => row.revenue), 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Revenue by Status
        </p>
        <h2 className="text-base font-bold text-slate-900">Value Distribution</h2>
      </div>
      <div className="space-y-4">
        {rows.map((row) => {
          const width = max > 0 ? (row.revenue / max) * 100 : 0;
          const cfg = STATUS_CONFIG[row.value];

          return (
            <div key={row.value}>
              <div className="mb-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-sm font-bold text-slate-700">{row.label}</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(row.revenue)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-3 rounded-full ${cfg.bar}`} style={{ width: `${width}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{row.count} leads</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

