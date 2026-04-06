import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { auditRecordOperation } from "@/lib/audit-logger";

/**
 * Admin System Settings API
 * GET: Get all system settings or filter by category
 * PUT: Update a system setting
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
    const category = searchParams.get("category") || "";

    let query = supabase
      .from("system_settings")
      .select("*");

    if (category) {
      query = query.eq("category", category);
    }

    const { data: settings, error } = await query.order("category").order("key");

    if (error) throw error;

    // Remove sensitive values from response
    const sanitized = settings?.map(setting => ({
      ...setting,
      value: setting.is_sensitive ? "***REDACTED***" : setting.value
    })) || [];

    return NextResponse.json({
      settings: sanitized,
      categories: [...new Set(settings?.map(s => s.category) || [])],
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { key, value, category, description } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Missing required field: key" },
        { status: 400 }
      );
    }

    // Get old value
    const { data: oldSetting } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", key)
      .single();

    // Update or insert
    const { data: updatedSetting, error } = await supabase
      .from("system_settings")
      .upsert({
        key,
        value: typeof value === "string" ? JSON.parse(`"${value}"`) : value,
        category: category || oldSetting?.category || "general",
        description: description || oldSetting?.description,
        is_sensitive: oldSetting?.is_sensitive || false,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await auditRecordOperation(
      adminUser.id,
      oldSetting ? "update" : "create",
      "system_setting",
      updatedSetting.id,
      oldSetting,
      updatedSetting
    );

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
