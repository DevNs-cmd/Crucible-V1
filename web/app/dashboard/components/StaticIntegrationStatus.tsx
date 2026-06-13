// Static placeholder: backend endpoint not yet available
const INTEGRATIONS = [
  { label: "Frontend to Backend", detail: "REST APIs", ok: true },
  { label: "Real-time Sync", detail: "Supabase / Firebase", ok: true },
  { label: "Webhook Automation", detail: "n8n webhooks", ok: true },
  { label: "Auth Service", detail: "JWT middleware", ok: true },
  { label: "AI Audit API", detail: "Generate route", ok: true },
  { label: "Email Automation", detail: "n8n sequences", ok: false },
];

export function StaticIntegrationStatus() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-amber-600">
        Integration Layer
      </p>
      <div className="flex flex-wrap gap-4">
        {INTEGRATIONS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5"
          >
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${
                item.ok ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">{item.label}</span>
            <span className="font-mono text-[11px] text-slate-400">{item.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

