// Static placeholder: backend endpoint not yet available
const LOGS = [
  { ts: "09:00:01", level: "INFO", message: "Server initialized on port 4000" },
  { ts: "09:00:03", level: "INFO", message: "Supabase connection established" },
  { ts: "09:00:07", level: "SUCCESS", message: "Migration 001 applied successfully" },
  { ts: "09:00:14", level: "INFO", message: "Registered REST endpoints" },
  { ts: "09:00:18", level: "WARN", message: "Rate limiter defaulting to 60 req/min" },
  { ts: "09:00:45", level: "SUCCESS", message: "CRM backend health check passed" },
];

const LEVEL_COLOR: Record<string, string> = {
  INFO: "text-slate-400",
  SUCCESS: "text-emerald-500",
  WARN: "text-amber-500",
  ERROR: "text-red-500",
};

export function StaticActivityLog() {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-700 px-6 pb-4 pt-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
            Static Log
          </p>
          <h2 className="text-base font-bold text-slate-100">System Activity Log</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          Snapshot
        </span>
      </div>
      <div className="max-h-80 flex-1 space-y-1 overflow-y-auto px-4 py-3 font-mono text-xs">
        {LOGS.map((log) => (
          <div key={`${log.ts}-${log.message}`} className="flex items-start gap-3 leading-relaxed">
            <span className="flex-shrink-0 tabular-nums text-slate-600">{log.ts}</span>
            <span className={`w-14 flex-shrink-0 font-bold ${LEVEL_COLOR[log.level]}`}>
              {log.level}
            </span>
            <span className="break-words text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

