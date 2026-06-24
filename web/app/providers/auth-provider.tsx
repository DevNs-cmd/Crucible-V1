"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearAuthToken,
  getCurrentUser,
  getStoredRefreshToken,
  getStoredToken,
  loginWithCredentials,
  logoutWithToken,
  refreshAccessToken,
  type AuthUser,
} from "@/app/lib/auth";
import { ApiRequestError } from "@/app/lib/api";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
    const storedToken = getStoredToken();
    const storedRefreshToken = getStoredRefreshToken();

    const hydrateUser = async (accessToken: string) => {
      const currentUser = await getCurrentUser(accessToken);
      setToken(accessToken);
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    };

    const refreshFromStoredToken = async () => {
      if (!storedRefreshToken) return null;

      const nextToken = await refreshAccessToken(storedRefreshToken);
      return hydrateUser(nextToken);
    };

    if (!storedToken) {
      try {
        const currentUser = await refreshFromStoredToken();
        if (currentUser) return currentUser;
      } catch {
        clearSession();
        return null;
      }

      setStatus("unauthenticated");
      return null;
    }

    try {
      return await hydrateUser(storedToken);
    } catch (err) {
      if (!(err instanceof ApiRequestError) || err.status !== 401 || !storedRefreshToken) {
        clearSession();
        return null;
      }

      try {
        return await refreshFromStoredToken();
      } catch {
        clearSession();
        return null;
      }
    }
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      await refreshSession();
      if (!active) return;
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginWithCredentials(email, password);
    setToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutWithToken(getStoredToken());
    clearSession();
  }, [clearSession]);

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
