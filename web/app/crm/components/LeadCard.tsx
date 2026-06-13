"use client";

import Link from "next/link";
import type { Lead } from "@/app/lib/api";
import {
  formatCurrency,
  initials,
  leadValue,
  STATUS_CONFIG,
  STATUS_LABELS,
} from "@/app/lib/crm";

interface LeadCardProps {
  lead: Lead;
  canMoveBack: boolean;
  canMoveForward: boolean;
  isUpdating: boolean;
  onMove: (id: string, dir: 1 | -1) => void;
}

export function LeadCard({
  lead,
  canMoveBack,
  canMoveForward,
  isUpdating,
  onMove,
}: LeadCardProps) {
  const cfg = STATUS_CONFIG[lead.status];

  return (
    <article className="group rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 transition-all hover:border-amber-200 hover:shadow-sm">
      <Link href={`/crm/${lead.id}`} className="block">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-extrabold text-white">
              {initials(lead.company)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900">
                {lead.company}
              </p>
              <p className="truncate text-[11px] text-slate-500">{lead.full_name}</p>
            </div>
          </div>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}
          >
            {STATUS_LABELS[lead.status]}
          </span>
        </div>

        <p className="truncate text-[11px] text-slate-400">{lead.email}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-base font-extrabold text-slate-900">
            {formatCurrency(leadValue(lead))}
          </span>
          {lead.industry && (
            <span className="truncate rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {lead.industry}
            </span>
          )}
        </div>
      </Link>

      {lead.status === "closed_won" && (
        <p className="mt-1.5 text-[10px] font-bold text-emerald-600">Deal closed</p>
      )}
      {lead.status === "closed_lost" && (
        <p className="mt-1.5 text-[10px] font-bold text-red-600">Deal lost</p>
      )}

      <div className="mt-3 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {canMoveBack && (
          <button
            type="button"
            onClick={() => onMove(lead.id, -1)}
            disabled={isUpdating}
            className="flex-1 rounded-lg border border-slate-200 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Back
          </button>
        )}
        {canMoveForward && (
          <button
            type="button"
            onClick={() => onMove(lead.id, 1)}
            disabled={isUpdating}
            className="flex-1 rounded-lg border border-amber-200 bg-amber-50 py-1 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            Advance
          </button>
        )}
      </div>
    </article>
  );
}

