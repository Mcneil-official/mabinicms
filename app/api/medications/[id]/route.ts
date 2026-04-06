import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/auth";
import {
  deleteMedicationInventory,
  updateMedicationInventory,
} from "@/lib/queries/medications";

function canManage(role: string) {
  return role === "workers" || role === "staff";
}

function normalizeBarangay(value: string) {
  return value.trim().toUpperCase();
}

async function ensureStaffScopedMedicationAccess(
  medicationId: string,
  assignedBarangay: string,
  requireExclusive = false,
) {
  const supabase = await createServerSupabaseClient();
  const normalizedAssignedBarangay = normalizeBarangay(assignedBarangay);

  const { data, error } = await supabase
    .from("medication_allocations")
    .select("barangay")
    .eq("medication_id", medicationId);

  if (error) {
    throw error;
  }

  const rows = (data || []) as { barangay: string }[];
  if (rows.length === 0) {
    throw new Error("No barangay allocation found for this medication.");
  }

  const hasOwnAllocation = rows.some(
    (row) => normalizeBarangay(row.barangay || "") === normalizedAssignedBarangay,
  );

  if (!hasOwnAllocation) {
    throw new Error("You can only manage medications allocated to your barangay.");
  }

  if (requireExclusive) {
    const hasOtherBarangay = rows.some(
      (row) => normalizeBarangay(row.barangay || "") !== normalizedAssignedBarangay,
    );

    if (hasOtherBarangay) {
      throw new Error(
        "Cannot delete medication allocated to multiple barangays.",
      );
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = (session.user.role || "").trim().toLowerCase();

    if (!canManage(normalizedRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (normalizedRole === "staff") {
      const assignedBarangay = session.user.assigned_barangay?.trim();

      if (!assignedBarangay) {
        return NextResponse.json(
          { error: "No assigned barangay found for this user." },
          { status: 400 },
        );
      }

      await ensureStaffScopedMedicationAccess(id, assignedBarangay);
    }

    await updateMedicationInventory(
      id,
      {
        medicine_name:
          typeof body?.medicine_name === "string" ? body.medicine_name : undefined,
        category: typeof body?.category === "string" ? body.category : undefined,
        batch_number:
          typeof body?.batch_number === "string" ? body.batch_number : undefined,
        quantity: typeof body?.quantity === "number" ? body.quantity : undefined,
        expiration_date:
          typeof body?.expiration_date === "string"
            ? body.expiration_date
            : undefined,
        low_stock_threshold:
          typeof body?.low_stock_threshold === "number"
            ? body.low_stock_threshold
            : undefined,
      },
      session.user.id,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/medications/:id]", error);
    const message = error instanceof Error ? error.message : "Failed to update medication";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = (session.user.role || "").trim().toLowerCase();

    if (!canManage(normalizedRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (normalizedRole === "staff") {
      const assignedBarangay = session.user.assigned_barangay?.trim();

      if (!assignedBarangay) {
        return NextResponse.json(
          { error: "No assigned barangay found for this user." },
          { status: 400 },
        );
      }

      await ensureStaffScopedMedicationAccess(id, assignedBarangay, true);
    }

    await deleteMedicationInventory(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/medications/:id]", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete medication";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
