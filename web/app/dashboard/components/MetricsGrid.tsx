import type { DashboardStats } from "@/app/lib/api";
import { formatCurrency } from "@/app/lib/crm";

interface MetricsGridProps {
  stats: DashboardStats | null;
}

export function MetricsGrid({ stats }: MetricsGridProps) {
  const cards = [
    {
      label: "Total Leads",
      value: String(stats?.totalLeads ?? 0),
      detail: "From /api/analytics/dashboard",
      tone: "slate",
    },
    {
      label: "Active Leads",
      value: String(stats?.activeLeads ?? 0),
      detail: "Open pipeline",
      tone: "amber",
    },
    {
      label: "Conversion Rate",
      value: `${(stats?.conversionRate ?? 0).toFixed(1)}%`,
      detail: `${stats?.closedWon ?? 0} won / ${stats?.totalLeads ?? 0} total`,
      tone: "emerald",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(stats?.totalPipelineValue ?? 0),
      detail: "Backend lead value sum",
      tone: "blue",
    },
    {
      label: "Closed Lost",
      value: String(stats?.closedLost ?? 0),
      detail: "Lost opportunities",
      tone: "red",
    },
    {
      label: "Overdue Follow-ups",
      value: String(stats?.overdueFollowUps ?? 0),
      detail: "Incomplete and past due",
      tone: "emerald",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                card.tone === "amber"
                  ? "bg-amber-50 text-amber-700"
                  : card.tone === "emerald"
                    ? "bg-emerald-50 text-emerald-700"
                    : card.tone === "red"
                      ? "bg-red-50 text-red-700"
                      : card.tone === "blue"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
              }`}
            >
              {card.label}
            </span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">
            {card.value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}

