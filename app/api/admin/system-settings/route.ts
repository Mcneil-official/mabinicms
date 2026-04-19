import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import {
  adminSystemSettingsSchema,
  type AdminSystemSettingsInput,
} from "@/lib/schemas/admin";
import { auditRecordOperation } from "@/lib/audit-logger";

const SETTINGS_KEY = "admin_dashboard";

const defaultSettings: AdminSystemSettingsInput = {
  notificationRetentionDays: 180,
  lowStockAlertThreshold: 20,
  enableMedicationAutoSuggestions: true,
  enableAuditCsvExport: true,
  systemMaintenanceMode: false,
  defaultAnnouncementAudience: [],
};

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: adminUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", currentUser.id)
    .single();

  if (adminUser?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, adminUser };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { supabase } = auth;

    const { data, error } = await supabase
      .from("system_settings")
      .select("value_json")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error) throw error;

    const merged = {
      ...defaultSettings,
      ...(data?.value_json || {}),
    };

    const parsed = adminSystemSettingsSchema.safeParse(merged);
    if (!parsed.success) {
      return NextResponse.json({ settings: defaultSettings, invalidStoredValue: true });
    }

    return NextResponse.json({ settings: parsed.data });
  } catch (error) {
    console.error("[GET /api/admin/system-settings]", error);
    return NextResponse.json(
      { error: "Failed to load system settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { supabase, adminUser } = auth;

    const parsedBody = adminSystemSettingsSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const nextValue = parsedBody.data;

    const { data: previous } = await supabase
      .from("system_settings")
      .select("value_json")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: SETTINGS_KEY,
        value_json: nextValue,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) throw error;

    await auditRecordOperation(
      adminUser.id,
      "update",
      "system_settings",
      SETTINGS_KEY,
      previous?.value_json,
      nextValue
    );

    return NextResponse.json({ settings: nextValue });
  } catch (error) {
    console.error("[PUT /api/admin/system-settings]", error);
    return NextResponse.json(
      { error: "Failed to save system settings" },
      { status: 500 }
    );
  }
}
