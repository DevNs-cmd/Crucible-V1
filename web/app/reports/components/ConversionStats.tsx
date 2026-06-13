import type { Lead } from "@/app/lib/api";
import { formatCurrency, leadValue } from "@/app/lib/crm";

interface ConversionStatsProps {
  leads: Lead[];
}

export function ConversionStats({ leads }: ConversionStatsProps) {
  const total = leads.length;
  const won = leads.filter((lead) => lead.status === "closed_won");
  const lost = leads.filter((lead) => lead.status === "closed_lost");
  const active = leads.filter(
    (lead) => lead.status !== "closed_won" && lead.status !== "closed_lost"
  );
  const pipelineValue = leads.reduce((sum, lead) => sum + leadValue(lead), 0);
  const averageDeal = total > 0 ? pipelineValue / total : 0;
  const closed = won.length + lost.length;
  const winRate = closed > 0 ? (won.length / closed) * 100 : 0;

  const stats = [
    { label: "Total Leads", value: String(total), detail: "All CRM records" },
    { label: "Active Leads", value: String(active.length), detail: "Open pipeline" },
    { label: "Closed Won", value: String(won.length), detail: `${winRate.toFixed(0)}% win rate` },
    { label: "Closed Lost", value: String(lost.length), detail: "Lost opportunities" },
    { label: "Average Deal", value: formatCurrency(averageDeal), detail: "Across all leads" },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
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

