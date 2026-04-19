import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Proxy to protect dashboard routes and enforce role-based access
 * - Redirects unauthenticated users to /auth/login
 * - Routes users to appropriate dashboard based on role
 * - Enforces health worker access control
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const role = (value?: string) => (value || "").trim().toLowerCase();
  const isStaffRole = (value: string) => value === "staff" || value === "barangay";
  const getLoginPathForRequest = () => {
    if (pathname.startsWith("/dashboard-admin")) {
      return "/auth/admin";
    }

    if (pathname.startsWith("/dashboard-workers")) {
      return "/auth/workers";
    }

    return "/auth/login";
  };

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL(getLoginPathForRequest(), request.url));
  }

  if (session.expires_at < Date.now()) {
    const response = NextResponse.redirect(
      new URL(getLoginPathForRequest(), request.url),
    );
    response.cookies.delete("session");
    return response;
  }

  const userRole = role(session.user.role);

  if (!["admin", "workers", "staff", "barangay"].includes(userRole)) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  const isWorkerDashboard = pathname.startsWith("/dashboard-workers");
  const isAdminDashboard = pathname.startsWith("/dashboard-admin");
  const isStaffDashboard = pathname.startsWith("/dashboard-barangay");
  const isLegacyStaffDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isLegacyStaffApi =
    pathname === "/api/dashboard" || pathname.startsWith("/api/dashboard/");

  if (isLegacyStaffApi) {
    const suffix = pathname.slice("/api/dashboard".length);
    return NextResponse.redirect(
      new URL(`/api/dashboard-barangay${suffix}`, request.url),
    );
  }

  if (isLegacyStaffDashboard) {
    const suffix = pathname.slice("/dashboard".length);

    if (userRole === "workers") {
      return NextResponse.redirect(new URL("/dashboard-workers", request.url));
    }

    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard-admin", request.url));
    }

    return NextResponse.redirect(
      new URL(`/dashboard-barangay${suffix}`, request.url),
    );
  }

  if (isWorkerDashboard && userRole !== "workers") {
    const target = userRole === "admin" ? "/dashboard-admin" : "/dashboard-barangay";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isAdminDashboard && userRole !== "admin") {
    const target = userRole === "workers" ? "/dashboard-workers" : "/dashboard-barangay";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isStaffDashboard && !isStaffRole(userRole)) {
    const target = userRole === "workers" ? "/dashboard-workers" : "/dashboard-admin";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - offline.html (offline fallback)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|offline\\.html|public).*)",
  ],
};
