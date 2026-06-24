import type { Lead } from "@/app/lib/api";
import {
  formatCurrency,
  leadValue,
  STATUS_COLUMNS,
  STATUS_CONFIG,
} from "@/app/lib/crm";

interface PipelineSummaryProps {
  leads: Lead[];
}

export function PipelineSummary({ leads }: PipelineSummaryProps) {
  const totalPipeline = leads.reduce((sum, lead) => sum + leadValue(lead), 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-amber-600">
        Pipeline Summary
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {STATUS_COLUMNS.map((status) => {
          const stageLeads = leads.filter((lead) => lead.status === status.value);
          const stageValue = stageLeads.reduce((sum, lead) => sum + leadValue(lead), 0);
          const pct = totalPipeline > 0 ? (stageValue / totalPipeline) * 100 : 0;
          const cfg = STATUS_CONFIG[status.value];

          return (
            <div key={status.value}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-bold text-slate-700">{status.label}</span>
              </div>
              <p className="mb-1 text-lg font-extrabold text-slate-900">
                {formatCurrency(stageValue)}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {stageLeads.length} leads - {pct.toFixed(0)}% of pipeline
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

