import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    // Only staff and admins can update appointment status
    if (
      !session ||
      !["admin", "staff"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId, status, notes } = await request.json();

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    // Update appointment status
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status,
        notes: notes || null,
        booked_at: status === "booked" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select();

    if (error) {
      console.error("[update-appointment-status]", error);
      return NextResponse.json(
        { error: "Failed to update appointment" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      action: `updated appointment status to ${status}`,
      resource_type: "appointment",
      resource_id: appointmentId,
      changes: { status },
    });

    return NextResponse.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error("[update-appointment-status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
