import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createMedicationInventory,
  getMedicationBarangays,
  getMedicationInventoryForBarangay,
  getMedicationInventoryForCho,
  performMedicationDistribution,
} from "@/lib/queries/medications";

function canManage(role: string) {
  return role === "workers" || role === "staff";
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = (session.user.role || "").trim().toLowerCase();

    if (normalizedRole === "workers") {
      const [data, barangays] = await Promise.all([
        getMedicationInventoryForCho(),
        getMedicationBarangays(),
      ]);

      return NextResponse.json({
        mode: "cho",
        can_manage: true,
        barangays,
        ...data,
      });
    }

    const assignedBarangay = session.user.assigned_barangay?.trim();

    if (!assignedBarangay) {
      return NextResponse.json(
        { error: "No assigned barangay found for this user." },
        { status: 400 },
      );
    }

    const data = await getMedicationInventoryForBarangay(assignedBarangay);

    return NextResponse.json({
      mode: "worker",
      can_manage: normalizedRole === "staff",
      barangay: assignedBarangay,
      ...data,
    });
  } catch (error) {
    console.error("[GET /api/medications]", error);
    return NextResponse.json(
      { error: "Failed to load medication inventory" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = (session.user.role || "").trim().toLowerCase();

    if (!canManage(normalizedRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const medicineName = String(body?.medicine_name || "").trim();
    const category = String(body?.category || "").trim();
    const batchNumber = String(body?.batch_number || "").trim();
    const quantity = Number(body?.quantity || 0);
    const expirationDate = String(body?.expiration_date || "").trim();
    const lowStockThreshold = Number(body?.low_stock_threshold || 20);

    if (!medicineName || !category || !batchNumber || !expirationDate) {
      return NextResponse.json(
        {
          error:
            "medicine_name, category, batch_number, and expiration_date are required",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "quantity must be a non-negative number" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
      return NextResponse.json(
        { error: "low_stock_threshold must be a non-negative number" },
        { status: 400 },
      );
    }

    const id = await createMedicationInventory(
      {
        medicine_name: medicineName,
        category,
        batch_number: batchNumber,
        quantity,
        expiration_date: expirationDate,
        low_stock_threshold: lowStockThreshold,
      },
      session.user.id,
    );

    if (normalizedRole === "staff") {
      const assignedBarangay = session.user.assigned_barangay?.trim();

      if (!assignedBarangay) {
        return NextResponse.json(
          { error: "No assigned barangay found for this user." },
          { status: 400 },
        );
      }

      if (quantity > 0) {
        await performMedicationDistribution(
          {
            actionType: "allocate",
            medicationId: id,
            quantity,
            barangay: assignedBarangay,
            notes: "Initial stock allocation for barangay staff medication entry.",
          },
          session.user.id,
        );
      }
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/medications]", error);
    const message = error instanceof Error ? error.message : "Failed to create medication";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
