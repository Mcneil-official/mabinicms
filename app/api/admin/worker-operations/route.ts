import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { adminWorkerOperationsQuerySchema } from "@/lib/schemas/admin";

interface WorkerActivity {
  id: string;
  action: string;
  resource_type: string;
  status: string;
  created_at: string;
  user_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", currentUser.id)
      .single();

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsedQuery = adminWorkerOperationsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { page, limit, search, barangay, status } = parsedQuery.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("users")
      .select("id, username, role, assigned_barangay, is_active, created_at, last_login_at", {
        count: "exact",
      })
      .eq("role", "workers");

    if (search) {
      query = query.ilike("username", `%${search}%`);
    }

    if (barangay) {
      query = query.eq("assigned_barangay", barangay);
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    const { data: workers, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = workers || [];
    const workerIds = rows.map((worker) => worker.id);

    const summary = {
      totalWorkers: count || 0,
      activeWorkers: rows.filter((row) => row.is_active).length,
      inactiveWorkers: rows.filter((row) => !row.is_active).length,
      uniqueBarangays: new Set(rows.map((row) => row.assigned_barangay).filter(Boolean)).size,
    };

    let recentActivity: WorkerActivity[] = [];
    if (workerIds.length > 0) {
      const { data: logs, error: logError } = await supabase
        .from("audit_logs")
        .select("id, action, resource_type, status, created_at, user_id")
        .in("user_id", workerIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (logError) throw logError;
      recentActivity = (logs || []) as WorkerActivity[];
    }

    return NextResponse.json({
      workers: rows,
      summary,
      recentActivity,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/worker-operations]", error);
    return NextResponse.json(
      { error: "Failed to fetch worker operations data" },
      { status: 500 }
    );
  }
}
