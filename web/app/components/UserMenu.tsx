"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [pending, setPending] = React.useState(false);

  const handleLogout = async () => {
    setPending(true);
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

/**
 * User menu component showing current user info and logout option
 */
export function UserMenu() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <div className="flex flex-col items-end">
          <span className="text-slate-900 font-semibold">{user.full_name}</span>
          <span className="text-xs text-slate-500">{user.role}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-sm font-bold text-amber-700">
            {user.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="px-2 py-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
