import { useAuth } from "@/app/providers/auth-provider";

/**
 * Hook to get the current auth token for use with API requests.
 * Returns the token or null if user is not authenticated.
 */
export function useAuthToken() {
  const { token } = useAuth();
  return token;
}

/**
 * Hook to make authenticated API requests with automatic token handling.
 * Automatically includes the current auth token in request headers.
 */
export function useAuthenticatedRequest() {
  const token = useAuthToken();

  return async function request<T>(
    path: string,
    options: RequestInit & { body?: unknown } = {}
  ): Promise<T> {
    const { apiRequest } = await import("@/app/lib/api");
    return apiRequest<T>(path, {
      ...options,
      token,
    });
  };
}
