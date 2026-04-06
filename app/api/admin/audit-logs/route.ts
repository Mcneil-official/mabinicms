import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type AuditLog = {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  status: string;
  details?: string | null;
  created_at: string;
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
};

/**
 * Admin Audit Logs API
 * GET: Retrieve audit logs with filtering and pagination
 * POST: Export audit logs as CSV/JSON
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action") || "";
    const resourceType = searchParams.get("resourceType") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const userId = searchParams.get("userId") || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        user:users(id, username, role)
      `, { count: "exact" });

    if (action) {
      query = query.ilike("action", `%${action}%`);
    }

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (startDate) {
      query = query.gte("created_at", new Date(startDate).toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    const { data: logs, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      logs,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { format = "json", filters = {} } = body;

    // Build query with filters
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        user:users(id, username, role)
      `);

    if (filters.action) {
      query = query.ilike("action", `%${filters.action}%`);
    }
    if (filters.resourceType) {
      query = query.eq("resource_type", filters.resourceType);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.startDate) {
      query = query.gte("created_at", new Date(filters.startDate).toISOString());
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    const { data: logs, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    if (format === "csv") {
      // Convert to CSV
      const csv = convertToCSV(logs || []);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="audit-logs.csv"',
        },
      });
    } else {
      // JSON format
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="audit-logs.json"',
        },
      });
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}

function convertToCSV(logs: AuditLog[]): string {
  if (!logs.length) return "No data";

  const headers = [
    "ID",
    "User",
    "Action",
    "Resource Type",
    "Resource ID",
    "Status",
    "Details",
    "Created At",
  ];

  const rows = logs.map(log => [
    log.id,
    log.user?.username || "Unknown",
    log.action,
    log.resource_type,
    log.resource_id || "",
    log.status,
    log.details || "",
    new Date(log.created_at).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
