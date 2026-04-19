import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    // Only admins can update YAKAP status
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { yakakId, status, remarks } = await request.json();

    if (!yakakId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    // Update yakap application status
    const { data, error } = await supabase
      .from("yakap_applications")
      .update({
        status,
        remarks: remarks || null,
        approved_by: status === "approved" ? session.user.id : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", yakakId)
      .select();

    if (error) {
      console.error("[update-yakap-status]", error);
      return NextResponse.json(
        { error: "Failed to update YAKAP application" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      action: `updated YAKAP application status to ${status}`,
      resource_type: "yakap_application",
      resource_id: yakakId,
      changes: { status },
    });

    return NextResponse.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error("[update-yakap-status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
