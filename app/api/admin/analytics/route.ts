import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Analytics API
 * GET: Retrieve system-wide analytics and metrics
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: adminUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_id", currentUser.id)
      .single();

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get analytics type from query
    const { searchParams } = new URL(request.url);
    const analyticsType = searchParams.get("type") || "overview";

    const analytics: Record<string, any> = {};

    if (analyticsType === "overview" || analyticsType === "all") {
      // User statistics
      const { data: usersByRole } = await supabase
        .from("users")
        .select("role")
        .eq("is_active", true);

      const { data: totalUsers } = await supabase
        .from("users")
        .select("id", { count: "exact" });

      const { data: activeUsers } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("is_active", true);

      const { data: inactiveUsers } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("is_active", false);

      analytics.users = {
        total: totalUsers?.length || 0,
        active: activeUsers?.length || 0,
        inactive: inactiveUsers?.length || 0,
        byRole:
          usersByRole?.reduce((acc: Record<string, number>, user: { role: string }) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
          }, {}) || {},
      };

      // Residents statistics
      const { data: residents } = await supabase
        .from("residents")
        .select("id, barangay", { count: "exact" });

      const { data: barangayProfiles } = await supabase
        .from("barangay_profiles")
        .select("id, current_barangay", { count: "exact" });

      analytics.residents = {
        total: residents?.length || 0,
        profiles: barangayProfiles?.length || 0,
      };

      // Health facilities
      const { data: facilities } = await supabase
        .from("health_facilities")
        .select("id, barangay", { count: "exact" });

      analytics.facilities = {
        total: facilities?.length || 0,
        byBarangay:
          facilities?.reduce((acc: Record<string, number>, f: { barangay: string }) => {
          acc[f.barangay] = (acc[f.barangay] || 0) + 1;
          return acc;
          }, {}) || {},
      };

      // Recent activity
      const { data: recentLogs } = await supabase
        .from("audit_logs")
        .select("action, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);

      const actionsLast24h = recentLogs?.filter(log => {
        const logDate = new Date(log.created_at);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return logDate > yesterday;
      }).length || 0;

      analytics.activity = {
        logsLast24Hours: actionsLast24h,
        totalLogs: recentLogs?.length || 0,
      };
    }

    if (analyticsType === "submissions" || analyticsType === "all") {
      // Yakap submissions
      const { data: yakap } = await supabase
        .from("yakap_applications")
        .select("status", { count: "exact" });

      const { data: yakapByStatus } = await supabase
        .from("yakap_applications")
        .select("status");

      analytics.yakap = {
        total: yakap?.length || 0,
        byStatus:
          yakapByStatus?.reduce((acc: Record<string, number>, app: { status: string }) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
          }, {}) || {},
      };

      // Appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("status", { count: "exact" });

      const { data: appointmentsByStatus } = await supabase
        .from("appointments")
        .select("status");

      analytics.appointments = {
        total: appointments?.length || 0,
        byStatus:
          appointmentsByStatus?.reduce((acc: Record<string, number>, app: { status: string }) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
          }, {}) || {},
      };
    }

    // System health
    analytics.system = {
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "production",
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
