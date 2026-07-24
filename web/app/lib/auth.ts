import { ApiRequestError, apiRequest } from "@/app/lib/api";

export const AUTH_TOKEN_STORAGE_KEY = "crucible.auth.token";
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = "crucible.auth.refreshToken";
export const AUTH_TOKEN_COOKIE = "crucible_auth_token";
const LEGACY_AUTH_TOKEN_COOKIE = AUTH_TOKEN_STORAGE_KEY;
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "member";
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

function canUseDOM() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getCookie(name: string) {
  if (!canUseDOM()) return null;

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getStoredToken() {
  if (!canUseDOM()) return null;

  return (
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ??
    getCookie(AUTH_TOKEN_COOKIE) ??
    getCookie(LEGACY_AUTH_TOKEN_COOKIE)
  );
}

export function getStoredRefreshToken() {
  if (!canUseDOM()) return null;

  return window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

export function storeAuthTokens(accessToken: string, refreshToken?: string) {
  if (!canUseDOM()) return;

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    accessToken
  )}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (!canUseDOM()) return;

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${LEGACY_AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function loginWithCredentials(email: string, password: string) {
  const login = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
  });

  storeAuthTokens(login.accessToken, login.refreshToken);
  return login;
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthUser>("/auth/me", { token });
}

export async function refreshAccessToken(refreshToken: string) {
  const data = await apiRequest<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });

  storeAuthTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function logoutWithToken(token: string | null, refreshToken?: string | null) {
  try {
    await apiRequest<null>("/auth/logout", {
      method: "POST",
      token,
      body: refreshToken ? { refreshToken } : undefined,
    });
  } catch (err) {
    if (!(err instanceof ApiRequestError)) throw err;
  }

  clearAuthToken();
}
