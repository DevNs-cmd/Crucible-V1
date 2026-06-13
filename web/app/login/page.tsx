"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError } from "@/app/lib/api";
import { useAuth } from "@/app/providers/auth-provider";

function getNextPath() {
  if (typeof window === "undefined") return "/dashboard";

  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const loginRedirectInFlight = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !loginRedirectInFlight.current) {
      router.replace("/dashboard");
    }
  }, [router, status]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      loginRedirectInFlight.current = true;
      await login(email, password);
      router.replace(getNextPath());
    } catch (err) {
      loginRedirectInFlight.current = false;
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-7 pt-7 pb-5 border-b border-slate-100">
          <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
            Crucible
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Sign in
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Use your CRM account to continue.
          </p>
        </div>

        <form onSubmit={submit} className="px-7 py-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              minLength={6}
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              placeholder="Enter your password"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed text-white font-bold text-sm py-2.5 rounded-xl transition-colors shadow-sm shadow-amber-200"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
