"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthToken,
  getCurrentUser,
  getStoredToken,
  loginWithCredentials,
  logoutWithToken,
  storeAuthToken,
  type AuthUser,
} from "@/app/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROTECTED_PATHS = ["/dashboard", "/crm", "/audit", "/reports"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
  }, []);

  const refreshSession = useCallback(async () => {
    const storedToken = getStoredToken() || "dev-token";
    const currentUser = await getCurrentUser(storedToken);
    storeAuthToken(storedToken);
    setToken(storedToken);
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }, []);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      const currentUser = await refreshSession();
      if (!active) return;

      if (!currentUser && isProtectedPath(pathname)) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [pathname, refreshSession, router]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginWithCredentials(email, password);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutWithToken(getStoredToken());
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      login,
      logout,
      refreshSession,
    }),
    [user, token, status, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
