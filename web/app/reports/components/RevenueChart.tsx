import type { RevenueByMonth } from "@/app/lib/api";
import { formatCurrency } from "@/app/lib/crm";

interface RevenueChartProps {
  revenue: RevenueByMonth[];
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function RevenueChart({ revenue }: RevenueChartProps) {
  const rows = revenue;
  const max = Math.max(...rows.map((row) => row.revenue), 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Closed-Won Revenue
        </p>
        <h2 className="text-base font-bold text-slate-900">Monthly Revenue</h2>
      </div>
      <div className="space-y-4">
        {rows.map((row) => {
          const width = max > 0 ? (row.revenue / max) * 100 : 0;

          return (
            <div key={row.month}>
              <div className="mb-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">
                    {formatMonth(row.month)}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(row.revenue)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Closed-won deals</p>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            No closed-won revenue reported for the last six months.
          </p>
        )}
      </div>
    </section>
  );
}

