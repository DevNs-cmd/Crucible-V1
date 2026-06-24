"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/crm", label: "CRM" },
  { href: "/audit", label: "Audit" },
  { href: "/proposals", label: "Proposals" },
  { href: "/reports", label: "Reports" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AppShellProps {
  section: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AppShell({ section, children, actions }: AppShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2 shadow-sm sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Crucible
          </span>
          <span className="text-lg font-thin text-slate-200">/</span>
          <span className="truncate text-sm font-semibold text-slate-800">{section}</span>
        </div>

        <nav
          className="flex min-w-0 items-center gap-2 overflow-x-auto"
          aria-label="Primary navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-amber-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {actions}
          <button
            type="button"
            onClick={() => void logout()}
            className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </nav>
      </header>

      {children}
    </div>
  );
}

