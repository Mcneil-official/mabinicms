import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { auditRecordOperation } from "@/lib/audit-logger";

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

    const { data: facility, error } = await supabase
      .from("health_facilities")
      .select("*")
      .eq("id", id)
      .single();

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

    const body = await request.json();
    const { name, barangay, latitude, longitude, phone, email, operating_hours, capacity } = body;

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

    // Get facility before deletion
    const { data: facility } = await supabase
      .from("health_facilities")
      .select("*")
      .eq("id", id)
      .single();

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Delete facility
    const { error } = await supabase
      .from("health_facilities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log audit
    await auditRecordOperation(
      adminUser.id,
      "delete",
      "facility",
      id,
      facility,
      null
    );

    return NextResponse.json({
      message: "Facility deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting facility:", error);
    return NextResponse.json(
      { error: "Failed to delete facility" },
      { status: 500 }
    );
  }
}
