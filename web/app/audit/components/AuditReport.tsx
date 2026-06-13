import type { AuditReport as AuditReportData } from "@/app/lib/api";

interface AuditReportProps {
  report: AuditReportData | null;
}

function toText(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.join("\n");
  return value?.trim() || "No details returned.";
}

function toList(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function ReportList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No details returned.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AuditReport({ report }: AuditReportProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Generated Report
        </p>
        <h2 className="text-base font-bold text-slate-900">Audit Output</h2>
      </div>
      <div className="space-y-6 px-6 py-6">
        {!report ? (
          <div className="flex min-h-[520px] flex-col justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Awaiting Input
            </p>
            <h3 className="text-xl font-extrabold text-slate-900">
              Your AI audit will appear here.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Complete the form and generate a report using the existing audit API.
            </p>
          </div>
        ) : (
          <>
            <article className="rounded-2xl bg-slate-50 px-5 py-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                Executive Summary
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {toText(report.executiveSummary)}
              </p>
            </article>

            {[
              { title: "Pain Points", items: toList(report.painPoints) },
              { title: "Recommendations", items: toList(report.recommendations) },
              { title: "AI Opportunities", items: toList(report.aiOpportunities) },
              {
                title: "Implementation Roadmap",
                items: toList(report.implementationRoadmap),
              },
            ].map((section) => (
              <article key={section.title}>
                <h3 className="mb-3 text-sm font-extrabold text-slate-900">
                  {section.title}
                </h3>
                <ReportList items={section.items} />
              </article>
            ))}

            <article className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Estimated ROI
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-emerald-900">
                {toText(report.estimatedROI)}
              </p>
            </article>
          </>
        )}
      </div>
    </section>
  );
}

