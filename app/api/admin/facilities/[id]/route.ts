import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { auditRecordOperation } from "@/lib/audit-logger";
import {
  adminDeactivateFacilitySchema,
  adminUpsertFacilitySchema,
} from "@/lib/schemas/admin";

/**
 * Admin Single Facility API
 * GET: Get facility details
 * PUT: Update facility
 * DELETE: Delete facility
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

    let query = supabase
      .from("health_facilities")
      .select("*")
      .eq("id", id);

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: facility, error } = await query.single();

    if (error) throw error;
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    return NextResponse.json(facility);
  } catch (error) {
    console.error("Error fetching facility:", error);
    return NextResponse.json(
      { error: "Failed to fetch facility" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get old values
    const { data: oldFacility } = await supabase
      .from("health_facilities")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldFacility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const parsedBody = adminUpsertFacilitySchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, barangay, latitude, longitude, phone, email, operating_hours, capacity } = parsedBody.data;

    // Update facility
    const { data: updatedFacility, error } = await supabase
      .from("health_facilities")
      .update({
        name: name || oldFacility.name,
        barangay: barangay || oldFacility.barangay,
        latitude: latitude !== undefined ? latitude : oldFacility.latitude,
        longitude: longitude !== undefined ? longitude : oldFacility.longitude,
        phone: phone !== undefined ? phone : oldFacility.phone,
        email: email !== undefined ? email : oldFacility.email,
        operating_hours: operating_hours || oldFacility.operating_hours,
        capacity: capacity !== undefined ? capacity : oldFacility.capacity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await auditRecordOperation(
      adminUser.id,
      "update",
      "facility",
      id,
      oldFacility,
      updatedFacility
    );

    return NextResponse.json(updatedFacility);
  } catch (error) {
    console.error("Error updating facility:", error);
    return NextResponse.json(
      { error: "Failed to update facility" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const parsedBody = adminDeactivateFacilitySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { reason } = parsedBody.data;

    // Get facility before deactivation
    const { data: facility } = await supabase
      .from("health_facilities")
      .select("*")
      .eq("id", id)
      .single();

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Soft delete facility
    const { data: deactivatedFacility, error } = await supabase
      .from("health_facilities")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: adminUser.id,
        deactivation_reason: reason || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await auditRecordOperation(
      adminUser.id,
      "delete",
      "facility",
      id,
      facility,
      { ...deactivatedFacility, action: "deactivated" }
    );

    return NextResponse.json({
      message: "Facility deactivated successfully",
      facility: deactivatedFacility,
    });
  } catch (error) {
    console.error("Error deleting facility:", error);
    return NextResponse.json(
      { error: "Failed to delete facility" },
      { status: 500 }
    );
  }
}
