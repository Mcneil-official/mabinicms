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

  // Protected routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard");

  // Public routes that don't require auth
  const isPublicRoute = pathname.startsWith("/auth") || pathname === "/";

  if (isProtectedRoute) {
    const session = await getSession();

    if (!session) {
      // Redirect to login page
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if session has expired
    if (session.expires_at < Date.now()) {
      const loginUrl = new URL("/auth/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      // Clear expired session
      response.cookies.delete("session");
      return response;
    }

    const userRole = role(session.user.role);

    // Role-based route protection: workers vs LGU dashboard separation
    const isWorkerDashboard = pathname.startsWith("/dashboard-workers");
    const isLguDashboard = pathname.startsWith("/dashboard") && !isWorkerDashboard;

    // Workers must use /dashboard-workers, not /dashboard
    if (isLguDashboard && userRole === "workers") {
      return NextResponse.redirect(new URL("/dashboard-workers", request.url));
    }

    // LGU users (non-workers) must use /dashboard, not /dashboard-workers
    if (isWorkerDashboard && userRole !== "workers") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Route workers away from staff/CHO dashboards
    if (pathname.startsWith("/dashboard-barangay") && userRole !== "barangay_admin" && userRole !== "staff") {
      const target = userRole === "workers" ? "/dashboard-workers" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      if (userRole === "workers") {
        return NextResponse.redirect(new URL("/dashboard-workers", request.url));
      }
    }

    // Sub-route protection
    const healthWorkerRoute = pathname.startsWith("/dashboard/health-workers");
    const staffRoute = pathname.startsWith("/dashboard/staff");

    if (healthWorkerRoute && userRole !== "workers") {
      // Non-health workers trying to access health worker routes
      const approporiateRoute =
        userRole === "staff" || userRole === "barangay_admin" ? "/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(approporiateRoute, request.url));
    }

    if (staffRoute && userRole !== "staff" && userRole !== "admin" && userRole !== "barangay_admin") {
      // Non-staff trying to access staff routes
      const appropriateRoute =
        userRole === "workers"
          ? "/dashboard/health-workers"
          : "/dashboard";
      return NextResponse.redirect(new URL(appropriateRoute, request.url));
    }
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
