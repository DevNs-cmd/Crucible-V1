"use client";

import type { Lead, LeadStatus } from "@/app/lib/api";
import {
  formatCurrency,
  leadValue,
  STATUS_COLUMNS,
  STATUS_CONFIG,
  type StatusColumn,
} from "@/app/lib/crm";
import { LeadCard } from "@/app/crm/components/LeadCard";

interface LeadColumnProps {
  status: StatusColumn;
  leads: Lead[];
  updatingLeadId: string | null;
  onMoveLead: (id: string, dir: 1 | -1) => void;
  onAddLead: (status: LeadStatus) => void;
}

export function LeadColumn({
  status,
  leads,
  updatingLeadId,
  onMoveLead,
  onAddLead,
}: LeadColumnProps) {
  const cfg = STATUS_CONFIG[status.value];
  const stageValue = leads.reduce((sum, lead) => sum + leadValue(lead), 0);

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-t-4 border-slate-100 bg-white shadow-sm ${cfg.header}`}
    >
      <div className="border-b border-slate-100 px-4 pb-3 pt-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
            <span className="truncate text-sm font-extrabold text-slate-900">
              {status.label}
            </span>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {leads.length}
          </span>
        </div>
        <p className="pl-4 text-xs font-semibold text-slate-400">
          {formatCurrency(stageValue)}
        </p>
      </div>

      <div className="min-h-20 space-y-3 p-3">
        {leads.length === 0 && (
          <div className="py-6 text-center text-xs font-medium text-slate-300">
            No leads
          </div>
        )}

        {leads.map((lead) => {
          const currentIndex = STATUS_COLUMNS.findIndex(
            (item) => item.value === lead.status
          );

          return (
            <LeadCard
              key={lead.id}
              lead={lead}
              canMoveBack={currentIndex > 0}
              canMoveForward={currentIndex < STATUS_COLUMNS.length - 1}
              isUpdating={updatingLeadId === lead.id}
              onMove={onMoveLead}
            />
          );
        })}
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => onAddLead(status.value)}
          className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-amber-300 hover:text-amber-600"
        >
          + Add lead here
        </button>
      </div>
    </section>
  );
}

