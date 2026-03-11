import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Middleware to protect dashboard routes and enforce role-based access
 * - Redirects unauthenticated users to /auth/login
 * - Routes users to appropriate dashboard based on role
 * - Enforces health worker access control
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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

    // Role-based route protection: workers vs LGU dashboard separation
    const isWorkerDashboard = pathname.startsWith("/dashboard-workers");
    const isLguDashboard = pathname.startsWith("/dashboard") && !isWorkerDashboard;

    // Workers must use /dashboard-workers, not /dashboard
    if (isLguDashboard && session.user.role === "workers") {
      return NextResponse.redirect(new URL("/dashboard-workers", request.url));
    }

    // LGU users (non-workers) must use /dashboard, not /dashboard-workers
    if (isWorkerDashboard && session.user.role !== "workers") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Sub-route protection
    const healthWorkerRoute = pathname.startsWith("/dashboard/health-workers");
    const staffRoute = pathname.startsWith("/dashboard/staff");
    const pregnancyRoute = pathname.startsWith("/dashboard/pregnancy");

    if (healthWorkerRoute && session.user.role !== "workers") {
      // Non-health workers trying to access health worker routes
      const approporiateRoute =
        session.user.role === "staff" ? "/dashboard/staff" : "/dashboard";
      return NextResponse.redirect(new URL(approporiateRoute, request.url));
    }

    if (staffRoute && session.user.role !== "staff") {
      // Non-staff trying to access staff routes
      const appropriateRoute =
        session.user.role === "workers"
          ? "/dashboard/health-workers"
          : "/dashboard";
      return NextResponse.redirect(new URL(appropriateRoute, request.url));
    }

    // Pregnancy profiling is restricted to LGU staff, admins, and barangay admins
    if (
      pregnancyRoute &&
      !["staff", "admin", "barangay_admin"].includes(session.user.role)
    ) {
      const appropriateRoute =
        session.user.role === "workers"
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
