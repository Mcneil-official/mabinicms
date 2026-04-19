import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { auditRecordOperation } from "@/lib/audit-logger";
import {
  adminDeactivateUserSchema,
  adminUpdateUserSchema,
} from "@/lib/schemas/admin";

/**
 * Admin Single User API
 * GET: Get user details
 * PUT: Update user
 * DELETE: Deactivate user (soft delete)
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

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const { data: oldUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const parsedBody = adminUpdateUserSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { role, assigned_barangay, is_active } = parsedBody.data;

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        role: role || oldUser.role,
        user_role: role || oldUser.user_role,
        assigned_barangay: assigned_barangay !== undefined ? assigned_barangay : oldUser.assigned_barangay,
        is_active: is_active !== undefined ? is_active : oldUser.is_active,
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
      "user",
      id,
      oldUser,
      updatedUser
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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

    const parsedBody = adminDeactivateUserSchema.safeParse(await request.json());
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

    // Get old values
    const { data: oldUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete: deactivate user
    const { data: deactivatedUser, error } = await supabase
      .from("users")
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
      "user",
      id,
      oldUser,
      { ...deactivatedUser, action: "deactivated" }
    );

    return NextResponse.json({
      message: "User deactivated successfully",
      user: deactivatedUser,
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 }
    );
  }
}
