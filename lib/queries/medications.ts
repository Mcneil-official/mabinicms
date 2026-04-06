"use server";

import { createServerSupabaseClient } from "@/lib/auth";

export type MedicationActionType =
  | "allocate"
  | "dispense"
  | "restock"
  | "redistribute"
  | "adjust";

export interface MedicationAllocation {
  id: string;
  medication_id: string;
  barangay: string;
  allocated_quantity: number;
  updated_at: string;
}

export interface MedicationInventoryItem {
  id: string;
  medicine_name: string;
  category: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  allocations: MedicationAllocation[];
  allocated_total: number;
  central_available: number;
  days_to_expiry: number;
  is_low_stock: boolean;
  is_expiring_soon: boolean;
}

export interface MedicationDistributionHistoryItem {
  id: string;
  medication_id: string;
  action_type: MedicationActionType;
  quantity: number;
  barangay: string | null;
  from_barangay: string | null;
  to_barangay: string | null;
  notes: string | null;
  action_by: string | null;
  created_at: string;
  medicine_name?: string;
  category?: string;
  batch_number?: string;
}

export interface MedicationAlert {
  type: "low_stock" | "expiring_soon";
  medication_id: string;
  message: string;
  severity: "warning" | "critical";
}

export interface MedicationSuggestion {
  type: "restock" | "redistribute" | "prioritize_dispense";
  medication_id: string;
  message: string;
  recommended_quantity?: number;
}

interface CreateMedicationInput {
  medicine_name: string;
  category: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
  low_stock_threshold: number;
}

interface UpdateMedicationInput {
  medicine_name?: string;
  category?: string;
  batch_number?: string;
  quantity?: number;
  expiration_date?: string;
  low_stock_threshold?: number;
}

interface DistributionInput {
  actionType: MedicationActionType;
  medicationId: string;
  quantity: number;
  barangay?: string;
  fromBarangay?: string;
  toBarangay?: string;
  notes?: string;
}

interface MedicationRow {
  id: string;
  medicine_name: string;
  category: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

interface AllocationRow {
  id: string;
  medication_id: string;
  barangay: string;
  allocated_quantity: number;
  updated_at: string;
}

interface DistributionHistoryRow {
  id: string;
  medication_id: string;
  action_type: MedicationActionType;
  quantity: number;
  barangay: string | null;
  from_barangay: string | null;
  to_barangay: string | null;
  notes: string | null;
  action_by: string | null;
  created_at: string;
  medication_inventory:
    | {
        medicine_name?: string;
        category?: string;
        batch_number?: string;
      }
    | null;
}

function normalizeBarangay(value: string) {
  return value.trim().toUpperCase();
}

function getDaysToExpiry(expirationDate: string) {
  const expiry = new Date(expirationDate);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((expiry.getTime() - now.getTime()) / msPerDay);
}

async function logMedicationAction(
  medicationId: string | null,
  action: string,
  actorId: string,
  details: Record<string, unknown>,
) {
  const supabase = await createServerSupabaseClient();

  await supabase.from("medication_inventory_logs").insert({
    medication_id: medicationId,
    action,
    actor_id: actorId,
    details,
  });
}

function buildInventoryItems(
  medications: MedicationRow[],
  allocations: AllocationRow[],
): MedicationInventoryItem[] {
  const allocationMap = new Map<string, MedicationAllocation[]>();

  for (const allocation of allocations) {
    const list = allocationMap.get(allocation.medication_id) || [];
    list.push({
      id: allocation.id,
      medication_id: allocation.medication_id,
      barangay: allocation.barangay,
      allocated_quantity: allocation.allocated_quantity,
      updated_at: allocation.updated_at,
    });
    allocationMap.set(allocation.medication_id, list);
  }

  return medications.map((medication) => {
    const itemAllocations = allocationMap.get(medication.id) || [];
    const allocatedTotal = itemAllocations.reduce(
      (sum, row) => sum + row.allocated_quantity,
      0,
    );
    const centralAvailable = Math.max(medication.quantity - allocatedTotal, 0);
    const daysToExpiry = getDaysToExpiry(medication.expiration_date);

    return {
      ...medication,
      allocations: itemAllocations.sort((a, b) =>
        a.barangay.localeCompare(b.barangay),
      ),
      allocated_total: allocatedTotal,
      central_available: centralAvailable,
      days_to_expiry: daysToExpiry,
      is_low_stock: medication.quantity <= medication.low_stock_threshold,
      is_expiring_soon: daysToExpiry <= 30,
    };
  });
}

function buildMedicationInsights(items: MedicationInventoryItem[]) {
  const alerts: MedicationAlert[] = [];
  const suggestions: MedicationSuggestion[] = [];

  for (const item of items) {
    if (item.is_low_stock) {
      const severity =
        item.quantity === 0 || item.quantity <= Math.max(item.low_stock_threshold / 2, 1)
          ? "critical"
          : "warning";

      alerts.push({
        type: "low_stock",
        medication_id: item.id,
        severity,
        message: `${item.medicine_name} (${item.batch_number}) is low on stock (${item.quantity} units left).`,
      });

      const recommendedQuantity = Math.max(item.low_stock_threshold * 2 - item.quantity, 10);
      suggestions.push({
        type: "restock",
        medication_id: item.id,
        message: `Restock ${item.medicine_name} by at least ${recommendedQuantity} units.`,
        recommended_quantity: recommendedQuantity,
      });
    }

    if (item.is_expiring_soon) {
      const severity = item.days_to_expiry <= 7 ? "critical" : "warning";

      alerts.push({
        type: "expiring_soon",
        medication_id: item.id,
        severity,
        message: `${item.medicine_name} batch ${item.batch_number} expires in ${Math.max(item.days_to_expiry, 0)} day(s).`,
      });

      suggestions.push({
        type: "prioritize_dispense",
        medication_id: item.id,
        message: `Prioritize dispensing ${item.medicine_name} (batch ${item.batch_number}) before ${item.expiration_date}.`,
      });
    }

    const needyBarangays = item.allocations.filter(
      (allocation) => allocation.allocated_quantity <= Math.max(item.low_stock_threshold / 3, 5),
    );

    const surplusBarangays = item.allocations.filter(
      (allocation) => allocation.allocated_quantity > item.low_stock_threshold,
    );

    if (needyBarangays.length > 0 && surplusBarangays.length > 0) {
      const source = surplusBarangays[0];
      const target = needyBarangays[0];
      const quantity = Math.max(
        Math.min(source.allocated_quantity - item.low_stock_threshold, 20),
        5,
      );

      suggestions.push({
        type: "redistribute",
        medication_id: item.id,
        recommended_quantity: quantity,
        message: `Redistribute ${quantity} units of ${item.medicine_name} from ${source.barangay} to ${target.barangay}.`,
      });
    }
  }

  return {
    alerts: alerts.sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1,
    ),
    suggestions,
  };
}

export async function getMedicationInventoryForCho() {
  const supabase = await createServerSupabaseClient();

  const [medicationResult, allocationResult, historyResult] = await Promise.all([
    supabase
      .from("medication_inventory")
      .select(
        "id, medicine_name, category, batch_number, quantity, expiration_date, low_stock_threshold, created_at, updated_at",
      )
      .order("medicine_name", { ascending: true }),
    supabase
      .from("medication_allocations")
      .select("id, medication_id, barangay, allocated_quantity, updated_at"),
    supabase
      .from("medication_distribution_history")
      .select(
        "id, medication_id, action_type, quantity, barangay, from_barangay, to_barangay, notes, action_by, created_at, medication_inventory(medicine_name, category, batch_number)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (medicationResult.error) throw medicationResult.error;
  if (allocationResult.error) throw allocationResult.error;
  if (historyResult.error) throw historyResult.error;

  const items = buildInventoryItems(
    (medicationResult.data || []) as MedicationRow[],
    (allocationResult.data || []) as AllocationRow[],
  );

  const history = ((historyResult.data || []) as DistributionHistoryRow[]).map(
    (row) => ({
    id: row.id,
    medication_id: row.medication_id,
    action_type: row.action_type,
    quantity: row.quantity,
    barangay: row.barangay,
    from_barangay: row.from_barangay,
    to_barangay: row.to_barangay,
    notes: row.notes,
    action_by: row.action_by,
    created_at: row.created_at,
    medicine_name: row.medication_inventory?.medicine_name,
    category: row.medication_inventory?.category,
    batch_number: row.medication_inventory?.batch_number,
    }),
  ) as MedicationDistributionHistoryItem[];

  const { alerts, suggestions } = buildMedicationInsights(items);

  return {
    items,
    history,
    alerts,
    suggestions,
  };
}

export async function getMedicationInventoryForBarangay(barangay: string) {
  const supabase = await createServerSupabaseClient();
  const normalizedBarangay = normalizeBarangay(barangay);

  const allocationResult = await supabase
    .from("medication_allocations")
    .select("id, medication_id, barangay, allocated_quantity, updated_at")
    .ilike("barangay", normalizedBarangay);

  if (allocationResult.error) throw allocationResult.error;

  const allocations = (allocationResult.data || []) as AllocationRow[];
  const medicationIds = Array.from(new Set(allocations.map((row) => row.medication_id)));

  if (medicationIds.length === 0) {
    return {
      items: [] as MedicationInventoryItem[],
      history: [] as MedicationDistributionHistoryItem[],
      alerts: [] as MedicationAlert[],
      suggestions: [] as MedicationSuggestion[],
    };
  }

  const [medicationResult, historyResult] = await Promise.all([
    supabase
      .from("medication_inventory")
      .select(
        "id, medicine_name, category, batch_number, quantity, expiration_date, low_stock_threshold, created_at, updated_at",
      )
      .in("id", medicationIds)
      .order("medicine_name", { ascending: true }),
    supabase
      .from("medication_distribution_history")
      .select(
        "id, medication_id, action_type, quantity, barangay, from_barangay, to_barangay, notes, action_by, created_at, medication_inventory(medicine_name, category, batch_number)",
      )
      .in("medication_id", medicationIds)
      .or(
        `barangay.ilike.${normalizedBarangay},from_barangay.ilike.${normalizedBarangay},to_barangay.ilike.${normalizedBarangay}`,
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (medicationResult.error) throw medicationResult.error;
  if (historyResult.error) throw historyResult.error;

  const items = buildInventoryItems(
    (medicationResult.data || []) as MedicationRow[],
    allocations,
  );

  const history = ((historyResult.data || []) as DistributionHistoryRow[]).map(
    (row) => ({
    id: row.id,
    medication_id: row.medication_id,
    action_type: row.action_type,
    quantity: row.quantity,
    barangay: row.barangay,
    from_barangay: row.from_barangay,
    to_barangay: row.to_barangay,
    notes: row.notes,
    action_by: row.action_by,
    created_at: row.created_at,
    medicine_name: row.medication_inventory?.medicine_name,
    category: row.medication_inventory?.category,
    batch_number: row.medication_inventory?.batch_number,
    }),
  ) as MedicationDistributionHistoryItem[];

  const scopedItems = items.map((item) => ({
    ...item,
    allocations: item.allocations.filter(
      (allocation) => normalizeBarangay(allocation.barangay) === normalizedBarangay,
    ),
  }));

  const { alerts, suggestions } = buildMedicationInsights(scopedItems);

  return {
    items: scopedItems,
    history,
    alerts,
    suggestions,
  };
}

export async function getMedicationBarangays() {
  const supabase = await createServerSupabaseClient();
  const [usersResult, residentsResult, allocationResult] = await Promise.all([
    supabase.from("users").select("assigned_barangay"),
    supabase.from("residents").select("barangay"),
    supabase.from("medication_allocations").select("barangay"),
  ]);

  const result = new Set<string>();

  for (const row of usersResult.data || []) {
    const value = (row as { assigned_barangay?: string }).assigned_barangay;
    if (value) result.add(normalizeBarangay(value));
  }

  for (const row of residentsResult.data || []) {
    const value = (row as { barangay?: string }).barangay;
    if (value) result.add(normalizeBarangay(value));
  }

  for (const row of allocationResult.data || []) {
    const value = (row as { barangay?: string }).barangay;
    if (value) result.add(normalizeBarangay(value));
  }

  return Array.from(result).sort((a, b) => a.localeCompare(b));
}

export async function createMedicationInventory(
  input: CreateMedicationInput,
  actorId: string,
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("medication_inventory")
    .insert({
      medicine_name: input.medicine_name.trim(),
      category: input.category.trim(),
      batch_number: input.batch_number.trim(),
      quantity: input.quantity,
      expiration_date: input.expiration_date,
      low_stock_threshold: input.low_stock_threshold,
      created_by: actorId,
      updated_by: actorId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await logMedicationAction(data.id, "create_medication", actorId, {
    ...input,
  });

  return data.id as string;
}

export async function updateMedicationInventory(
  id: string,
  input: UpdateMedicationInput,
  actorId: string,
) {
  const supabase = await createServerSupabaseClient();

  const updatePayload: Record<string, unknown> = {
    updated_by: actorId,
  };

  if (typeof input.medicine_name === "string") {
    updatePayload.medicine_name = input.medicine_name.trim();
  }
  if (typeof input.category === "string") {
    updatePayload.category = input.category.trim();
  }
  if (typeof input.batch_number === "string") {
    updatePayload.batch_number = input.batch_number.trim();
  }
  if (typeof input.quantity === "number") {
    updatePayload.quantity = input.quantity;
  }
  if (typeof input.expiration_date === "string") {
    updatePayload.expiration_date = input.expiration_date;
  }
  if (typeof input.low_stock_threshold === "number") {
    updatePayload.low_stock_threshold = input.low_stock_threshold;
  }

  const { error } = await supabase
    .from("medication_inventory")
    .update(updatePayload)
    .eq("id", id);

  if (error) throw error;

  await logMedicationAction(id, "update_medication", actorId, {
    changes: input,
  });
}

export async function deleteMedicationInventory(id: string, actorId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: existingError } = await supabase
    .from("medication_inventory")
    .select("id, medicine_name, category, batch_number")
    .eq("id", id)
    .single();

  if (existingError) throw existingError;

  const { error } = await supabase
    .from("medication_inventory")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await logMedicationAction(null, "delete_medication", actorId, {
    medication_id: id,
    medicine_name: existing.medicine_name,
    category: existing.category,
    batch_number: existing.batch_number,
  });
}

async function upsertAllocation(
  medicationId: string,
  barangay: string,
  quantityDelta: number,
  actorId: string,
) {
  const supabase = await createServerSupabaseClient();
  const normalizedBarangay = normalizeBarangay(barangay);

  const { data: existing, error: existingError } = await supabase
    .from("medication_allocations")
    .select("id, allocated_quantity")
    .eq("medication_id", medicationId)
    .ilike("barangay", normalizedBarangay)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    if (quantityDelta < 0) {
      throw new Error("Allocation cannot go below zero.");
    }

    const { error: insertError } = await supabase.from("medication_allocations").insert({
      medication_id: medicationId,
      barangay: normalizedBarangay,
      allocated_quantity: quantityDelta,
      updated_by: actorId,
    });

    if (insertError) throw insertError;
    return;
  }

  const nextQuantity = existing.allocated_quantity + quantityDelta;
  if (nextQuantity < 0) {
    throw new Error("Allocation cannot go below zero.");
  }

  const { error: updateError } = await supabase
    .from("medication_allocations")
    .update({
      allocated_quantity: nextQuantity,
      updated_by: actorId,
    })
    .eq("id", existing.id);

  if (updateError) throw updateError;
}

export async function performMedicationDistribution(
  input: DistributionInput,
  actorId: string,
) {
  const supabase = await createServerSupabaseClient();

  const { data: medication, error: medError } = await supabase
    .from("medication_inventory")
    .select("id, quantity, low_stock_threshold")
    .eq("id", input.medicationId)
    .single();

  if (medError || !medication) {
    throw medError || new Error("Medication not found.");
  }

  const quantity = Math.max(0, Math.floor(input.quantity));
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (input.actionType === "restock") {
    const { error } = await supabase
      .from("medication_inventory")
      .update({
        quantity: medication.quantity + quantity,
        updated_by: actorId,
      })
      .eq("id", input.medicationId);

    if (error) throw error;
  }

  if (input.actionType === "allocate") {
    const allocationRows = await supabase
      .from("medication_allocations")
      .select("allocated_quantity")
      .eq("medication_id", input.medicationId);

    if (allocationRows.error) throw allocationRows.error;

    const allocatedTotal = (allocationRows.data || []).reduce(
      (sum, row) => sum + row.allocated_quantity,
      0,
    );
    const centralAvailable = medication.quantity - allocatedTotal;

    if (centralAvailable < quantity) {
      throw new Error("Not enough central stock available for allocation.");
    }

    if (!input.barangay) {
      throw new Error("Barangay is required for allocation.");
    }

    await upsertAllocation(input.medicationId, input.barangay, quantity, actorId);
  }

  if (input.actionType === "dispense") {
    if (!input.barangay) {
      throw new Error("Barangay is required for dispensing.");
    }

    if (medication.quantity < quantity) {
      throw new Error("Cannot dispense more than total stock.");
    }

    await upsertAllocation(input.medicationId, input.barangay, -quantity, actorId);

    const { error } = await supabase
      .from("medication_inventory")
      .update({
        quantity: medication.quantity - quantity,
        updated_by: actorId,
      })
      .eq("id", input.medicationId);

    if (error) throw error;
  }

  if (input.actionType === "redistribute") {
    if (!input.fromBarangay || !input.toBarangay) {
      throw new Error("From and To barangay are required for redistribution.");
    }

    await upsertAllocation(input.medicationId, input.fromBarangay, -quantity, actorId);
    await upsertAllocation(input.medicationId, input.toBarangay, quantity, actorId);
  }

  if (input.actionType === "adjust") {
    const nextQuantity = medication.quantity + quantity;
    const { error } = await supabase
      .from("medication_inventory")
      .update({
        quantity: nextQuantity,
        updated_by: actorId,
      })
      .eq("id", input.medicationId);

    if (error) throw error;
  }

  const historyPayload = {
    medication_id: input.medicationId,
    action_type: input.actionType,
    quantity,
    barangay: input.barangay ? normalizeBarangay(input.barangay) : null,
    from_barangay: input.fromBarangay
      ? normalizeBarangay(input.fromBarangay)
      : null,
    to_barangay: input.toBarangay ? normalizeBarangay(input.toBarangay) : null,
    notes: input.notes?.trim() || null,
    action_by: actorId,
  };

  const { error: historyError } = await supabase
    .from("medication_distribution_history")
    .insert(historyPayload);

  if (historyError) throw historyError;

  await logMedicationAction(input.medicationId, `distribution_${input.actionType}`, actorId, {
    ...historyPayload,
  });
}
