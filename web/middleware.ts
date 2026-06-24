import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set(["/login"]);

// Routes that require authentication
const PROTECTED_ROUTES = new Set([
  "/dashboard",
  "/crm",
  "/reports",
  "/audit",
  "/proposals",
]);

const AUTH_TOKEN_COOKIE = "crucible_auth_token";
const LEGACY_AUTH_TOKEN_COOKIE = "crucible.auth.token";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token =
    request.cookies.get(AUTH_TOKEN_COOKIE)?.value ??
    request.cookies.get(LEGACY_AUTH_TOKEN_COOKIE)?.value;

  // Check if route is protected
  const isProtected = Array.from(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route)
  );
  const isPublic = Array.from(PUBLIC_ROUTES).some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without token
  if (isProtected && !token) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Redirect to dashboard if accessing login while authenticated
  if (isPublic && token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
