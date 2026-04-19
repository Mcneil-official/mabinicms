import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { getAvailableBarangays } from "@/lib/queries/announcements";

export async function GET() {
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

    const data = await getAvailableBarangays();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/admin/barangays]", error);
    return NextResponse.json(
      { error: "Failed to fetch barangays" },
      { status: 500 }
    );
  }
}
