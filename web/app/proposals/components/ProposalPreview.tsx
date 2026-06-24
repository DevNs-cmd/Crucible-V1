import type { ReactNode } from "react";
import type { Proposal } from "@/app/lib/api";

interface ProposalPreviewProps {
  proposal: Proposal | null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-slate-50 px-5 py-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
        {title}
      </p>
      {children}
    </article>
  );
}

function TextBlock({ value }: { value: string }) {
  return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>;
}

function ListBlock({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No details returned.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ProposalPreview({ proposal }: ProposalPreviewProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Generated Proposal
        </p>
        <h2 className="text-base font-bold text-slate-900">Proposal Output</h2>
      </div>
      <div className="space-y-6 px-6 py-6">
        {!proposal ? (
          <div className="flex min-h-[520px] flex-col justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Awaiting Input
            </p>
            <h3 className="text-xl font-extrabold text-slate-900">
              Your proposal will appear here.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Complete the form and generate a proposal using the existing proposal API.
            </p>
          </div>
        ) : (
          <>
            <Section title="Title">
              <h3 className="text-xl font-extrabold text-slate-900">{proposal.title}</h3>
            </Section>

            <Section title="Introduction">
              <TextBlock value={proposal.introduction} />
            </Section>

            <Section title="Problem Statement">
              <TextBlock value={proposal.problemStatement} />
            </Section>

            <Section title="Proposed Solution">
              <TextBlock value={proposal.proposedSolution} />
            </Section>

            <article>
              <h3 className="mb-3 text-sm font-extrabold text-slate-900">
                Services Breakdown
              </h3>
              <div className="space-y-3">
                {proposal.servicesBreakdown.map((service) => (
                  <div
                    key={`${service.service}-${service.timeline}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5"
                  >
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {service.service}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {service.description}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {service.timeline}
                      </span>
                    </div>
                    <ListBlock items={service.deliverables} />
                  </div>
                ))}
              </div>
            </article>

            <Section title="Investment Summary">
              <TextBlock value={proposal.investmentSummary} />
            </Section>

            <Section title="Why AlgoForce">
              <TextBlock value={proposal.whyAlgoForce} />
            </Section>

            <article>
              <h3 className="mb-3 text-sm font-extrabold text-slate-900">Next Steps</h3>
              <ListBlock items={proposal.nextSteps} />
            </article>

            <Section title="Terms And Conditions">
              <TextBlock value={proposal.termsAndConditions} />
            </Section>
          </>
        )}
      </div>
    </section>
  );
}
