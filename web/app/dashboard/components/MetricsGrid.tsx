import type { Lead } from "@/app/lib/api";
import { formatCurrency, leadValue } from "@/app/lib/crm";

interface MetricsGridProps {
  leads: Lead[];
}

export function MetricsGrid({ leads }: MetricsGridProps) {
  const pipelineValue = leads.reduce((sum, lead) => sum + leadValue(lead), 0);
  const wonValue = leads
    .filter((lead) => lead.status === "closed_won")
    .reduce((sum, lead) => sum + leadValue(lead), 0);
  const lostValue = leads
    .filter((lead) => lead.status === "closed_lost")
    .reduce((sum, lead) => sum + leadValue(lead), 0);

  const cards = [
    {
      label: "Total Leads",
      value: String(leads.length),
      detail: "From GET /api/leads",
      tone: "slate",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(pipelineValue),
      detail: "All lead values",
      tone: "amber",
    },
    {
      label: "Won Value",
      value: formatCurrency(wonValue),
      detail: "Closed won leads",
      tone: "emerald",
    },
    {
      label: "Lost Value",
      value: formatCurrency(lostValue),
      detail: "Closed lost leads",
      tone: "red",
    },
    // Static placeholder: backend endpoint not yet available
    {
      label: "Active AI Agents",
      value: "7",
      detail: "Static operations target",
      tone: "blue",
    },
    // Static placeholder: backend endpoint not yet available
    {
      label: "System Health Rate",
      value: "99.2%",
      detail: "Static status card",
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

