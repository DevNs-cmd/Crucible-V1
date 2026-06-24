import type { Lead, LeadsByStatus } from "@/app/lib/api";
import {
  formatCurrency,
  leadValue,
  STATUS_COLUMNS,
  STATUS_CONFIG,
} from "@/app/lib/crm";

interface PipelineTableProps {
  leads: Lead[];
  statusCounts: LeadsByStatus[];
  totalPipelineValue: number;
}

export function PipelineTable({
  leads,
  statusCounts,
  totalPipelineValue,
}: PipelineTableProps) {
  const countByStatus = new Map(statusCounts.map((item) => [item.status, item.count]));
  const totalValue =
    totalPipelineValue || leads.reduce((sum, lead) => sum + leadValue(lead), 0);
  const totalCount =
    statusCounts.length > 0
      ? statusCounts.reduce((sum, item) => sum + item.count, 0)
      : leads.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Pipeline Analytics
        </p>
        <h2 className="text-base font-bold text-slate-900">Status Breakdown</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Leads</th>
              <th className="px-6 py-3">Revenue</th>
              <th className="px-6 py-3">Average Value</th>
              <th className="px-6 py-3">Pipeline Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {STATUS_COLUMNS.map((status) => {
              const statusLeads = leads.filter((lead) => lead.status === status.value);
              const leadCount = countByStatus.get(status.value) ?? statusLeads.length;
              const revenue = statusLeads.reduce((sum, lead) => sum + leadValue(lead), 0);
              const average = leadCount > 0 ? revenue / leadCount : 0;
              const share = totalValue > 0 ? (revenue / totalValue) * 100 : 0;
              const cfg = STATUS_CONFIG[status.value];

              return (
                <tr key={status.value}>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cfg.badge}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">
                    {leadCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {formatCurrency(revenue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatCurrency(average)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {share.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalCount === 0 && (
        <p className="border-t border-slate-100 px-6 py-6 text-sm text-slate-400">
          No lead data is available for reporting yet.
        </p>
      )}
    </section>
  );
}

