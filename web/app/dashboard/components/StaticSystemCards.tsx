// Static placeholder: backend endpoint not yet available
const SYSTEM_CARDS = [
  { id: "F1+F4", title: "Dashboard UI", sub: "Protected pages", color: "amber" },
  { id: "F2+F3", title: "Lead Mgmt UI", sub: "CRM plus proposals", color: "amber" },
  { id: "B1", title: "CRM Backend", sub: "APIs, auth, DB", color: "slate" },
  { id: "B2+B3+B4", title: "AI Audit API", sub: "Audit generation", color: "slate" },
];

export function StaticSystemCards() {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {SYSTEM_CARDS.map((card) => (
        <div
          key={card.id}
          className={`rounded-2xl border px-5 py-4 ${
            card.color === "amber"
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-slate-100"
          }`}
        >
          <p
            className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${
              card.color === "amber" ? "text-amber-600" : "text-slate-500"
            }`}
          >
            {card.id}
          </p>
          <p className="text-sm font-extrabold text-slate-900">{card.title}</p>
          <p className="text-xs text-slate-500">{card.sub}</p>
        </div>
      ))}
    </section>
  );
}

