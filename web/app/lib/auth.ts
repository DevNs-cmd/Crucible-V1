export const AUTH_TOKEN_STORAGE_KEY = "crucible.auth.token";
export const AUTH_TOKEN_COOKIE = "crucible_auth_token";
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
  token: string;
  user: AuthUser;
}

const DEV_AUTH_TOKEN = "dev-token";

export const DEV_USER: AuthUser = {
  id: "dev",
  email: "dev@example.com",
  full_name: "Demo User",
  role: "admin",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

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

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? getCookie(AUTH_TOKEN_COOKIE);
}

export function storeAuthToken(token: string) {
  if (!canUseDOM()) return;

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    token
  )}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (!canUseDOM()) return;

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function loginWithCredentials(email: string, password: string) {
  const login: LoginResponse = {
    token: DEV_AUTH_TOKEN,
    user: DEV_USER,
  };

  storeAuthToken(login.token);
  return login;
}

export function getCurrentUser(token: string) {
  return Promise.resolve(DEV_USER);
}

export async function logoutWithToken(token: string | null) {
  clearAuthToken();
}
