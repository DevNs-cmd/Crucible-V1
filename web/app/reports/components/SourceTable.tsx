import type { Lead } from "@/app/lib/api";
import { formatCurrency, leadValue } from "@/app/lib/crm";

interface SourceTableProps {
  leads: Lead[];
}

export function SourceTable({ leads }: SourceTableProps) {
  const sourceMap = leads.reduce<Record<string, { count: number; revenue: number }>>(
    (acc, lead) => {
      const source = lead.source?.trim() || "Unspecified";
      acc[source] ??= { count: 0, revenue: 0 };
      acc[source].count += 1;
      acc[source].revenue += leadValue(lead);
      return acc;
    },
    {}
  );
  const rows = Object.entries(sourceMap).sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Existing Lead Fields
        </p>
        <h2 className="text-base font-bold text-slate-900">Revenue by Source</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No source data available.</p>
        ) : (
          rows.map(([source, value]) => (
            <div key={source} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">{source}</p>
                <p className="text-xs text-slate-400">{value.count} leads</p>
              </div>
              <p className="text-sm font-extrabold text-slate-900">
                {formatCurrency(value.revenue)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

