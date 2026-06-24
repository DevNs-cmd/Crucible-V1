import type { TopPerformer } from "@/app/lib/api";
import { formatCurrency } from "@/app/lib/crm";

interface TopPerformersTableProps {
  performers: TopPerformer[];
}

export function TopPerformersTable({ performers }: TopPerformersTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Backend Analytics
        </p>
        <h2 className="text-base font-bold text-slate-900">Top Performers</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Closed Won</th>
              <th className="px-6 py-3">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {performers.map((performer) => (
              <tr key={performer.userId}>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">
                  {performer.fullName}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">
                  {performer.closedWon}
                </td>
                <td className="px-6 py-4 text-sm font-extrabold text-slate-900">
                  {formatCurrency(performer.totalValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {performers.length === 0 && (
        <p className="border-t border-slate-100 px-6 py-6 text-sm text-slate-400">
          No closed-won performer data is available yet.
        </p>
      )}
    </section>
  );
}
