import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { auditRecordOperation } from "@/lib/audit-logger";

/**
 * Admin Health Facilities API
 * GET: List all facilities with filtering
 * POST: Create a new facility
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const barangay = searchParams.get("barangay") || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from("health_facilities")
      .select("*", { count: "exact" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (barangay) {
      query = query.eq("barangay", barangay);
    }

    const { data: facilities, count, error } = await query
      .order("name")
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      facilities,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch facilities" },
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
    const { name, barangay, latitude, longitude, phone, email, operating_hours, capacity } = body;

    if (!name || !barangay || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, barangay, latitude, longitude" },
        { status: 400 }
      );
    }

    // Create facility
    const { data: newFacility, error } = await supabase
      .from("health_facilities")
      .insert({
        name,
        barangay,
        latitude,
        longitude,
        phone: phone || null,
        email: email || null,
        operating_hours: operating_hours || { start: "08:00", end: "17:00" },
        capacity: capacity || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await auditRecordOperation(
      adminUser.id,
      "create",
      "facility",
      newFacility.id,
      undefined,
      newFacility
    );

    return NextResponse.json(newFacility, { status: 201 });
  } catch (error) {
    console.error("Error creating facility:", error);
    return NextResponse.json(
      { error: "Failed to create facility" },
      { status: 500 }
    );
  }
}
