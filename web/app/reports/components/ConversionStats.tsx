import type { DashboardStats } from "@/app/lib/api";
import { formatCurrency } from "@/app/lib/crm";

interface ConversionStatsProps {
  stats: DashboardStats | null;
}

export function ConversionStats({ stats }: ConversionStatsProps) {
  const total = stats?.totalLeads ?? 0;
  const averageDeal = total > 0 ? (stats?.totalPipelineValue ?? 0) / total : 0;

  const cards = [
    { label: "Total Leads", value: String(total), detail: "All CRM records" },
    { label: "Active Leads", value: String(stats?.activeLeads ?? 0), detail: "Open pipeline" },
    {
      label: "Closed Won",
      value: String(stats?.closedWon ?? 0),
      detail: `${(stats?.conversionRate ?? 0).toFixed(1)}% conversion`,
    },
    { label: "Closed Lost", value: String(stats?.closedLost ?? 0), detail: "Lost opportunities" },
    { label: "Average Deal", value: formatCurrency(averageDeal), detail: "Across all leads" },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stat.value}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{stat.detail}</p>
        </div>
      ))}
    </section>
  );
}

