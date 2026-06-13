import type { Lead } from "@/app/lib/api";
import {
  formatCurrency,
  leadValue,
  STATUS_COLUMNS,
  STATUS_CONFIG,
} from "@/app/lib/crm";

interface PipelineChartProps {
  leads: Lead[];
}

export function PipelineChart({ leads }: PipelineChartProps) {
  const values = STATUS_COLUMNS.map((status) => ({
    ...status,
    valueTotal: leads
      .filter((lead) => lead.status === status.value)
      .reduce((sum, lead) => sum + leadValue(lead), 0),
  }));
  const max = Math.max(...values.map((item) => item.valueTotal), 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Pipeline Value
        </p>
        <h2 className="text-base font-bold text-slate-900">Revenue by Stage</h2>
      </div>
      <div className="flex h-64 items-end gap-3 border-b border-slate-100 pb-3">
        {values.map((item) => {
          const pct = max > 0 ? Math.max(8, (item.valueTotal / max) * 100) : 0;
          const cfg = STATUS_CONFIG[item.value];

          return (
            <div key={item.value} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-48 w-full items-end justify-center">
                <div
                  className={`w-full max-w-14 rounded-t-lg ${cfg.bar}`}
                  style={{ height: `${pct}%` }}
                  title={`${item.label}: ${formatCurrency(item.valueTotal)}`}
                />
              </div>
              <p className="w-full truncate text-center text-[10px] font-bold text-slate-500">
                {item.label}
              </p>
              <p className="w-full truncate text-center text-[10px] text-slate-400">
                {formatCurrency(item.valueTotal)}
              </p>
            </div>
          );
        })}
      </div>
      {leads.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">
          Revenue bars will populate when leads have values.
        </p>
      )}
    </section>
  );
}

