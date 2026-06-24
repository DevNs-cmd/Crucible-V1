"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps a route to ensure user is authenticated.
 * Shows fallback while checking auth status, redirects to login if unauthenticated.
 */
export function ProtectedRoute({ 
  children, 
  fallback = <LoadingScreen /> 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, status, router]);

  if (status === "loading") {
    return fallback;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        <p className="mt-4 text-slate-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
