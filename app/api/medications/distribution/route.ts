import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { performMedicationDistribution } from "@/lib/queries/medications";

function canManage(role: string) {
  return role === "workers" || role === "admin";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManage(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const actionType = String(body?.actionType || "");
    const medicationId = String(body?.medicationId || "");
    const quantity = Number(body?.quantity || 0);

    if (!actionType || !medicationId || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: "actionType, medicationId, and a positive quantity are required",
        },
        { status: 400 },
      );
    }

    await performMedicationDistribution(
      {
        actionType: actionType as
          | "allocate"
          | "dispense"
          | "restock"
          | "redistribute"
          | "adjust",
        medicationId,
        quantity,
        barangay:
          typeof body?.barangay === "string" && body.barangay.trim()
            ? body.barangay.trim()
            : undefined,
        fromBarangay:
          typeof body?.fromBarangay === "string" && body.fromBarangay.trim()
            ? body.fromBarangay.trim()
            : undefined,
        toBarangay:
          typeof body?.toBarangay === "string" && body.toBarangay.trim()
            ? body.toBarangay.trim()
            : undefined,
        notes:
          typeof body?.notes === "string" && body.notes.trim()
            ? body.notes.trim()
            : undefined,
      },
      session.user.id,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/medications/distribution]", error);
    const message =
      error instanceof Error ? error.message : "Failed to process distribution";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
