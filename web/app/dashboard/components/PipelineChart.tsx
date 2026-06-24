import type { RevenueByMonth } from "@/app/lib/api";
import { formatCurrency } from "@/app/lib/crm";

interface PipelineChartProps {
  revenue: RevenueByMonth[];
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export function PipelineChart({ revenue }: PipelineChartProps) {
  const max = Math.max(...revenue.map((item) => item.revenue), 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Closed-Won Revenue
        </p>
        <h2 className="text-base font-bold text-slate-900">Monthly Trend</h2>
      </div>
      <div className="flex h-64 items-end gap-3 border-b border-slate-100 pb-3">
        {revenue.map((item) => {
          const pct = max > 0 ? Math.max(8, (item.revenue / max) * 100) : 0;

          return (
            <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-48 w-full items-end justify-center">
                <div
                  className="w-full max-w-14 rounded-t-lg bg-emerald-500"
                  style={{ height: `${pct}%` }}
                  title={`${formatMonth(item.month)}: ${formatCurrency(item.revenue)}`}
                />
              </div>
              <p className="w-full truncate text-center text-[10px] font-bold text-slate-500">
                {formatMonth(item.month)}
              </p>
              <p className="w-full truncate text-center text-[10px] text-slate-400">
                {formatCurrency(item.revenue)}
              </p>
            </div>
          );
        })}
      </div>
      {revenue.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">
          Monthly revenue will populate when deals close.
        </p>
      )}
    </section>
  );
}

