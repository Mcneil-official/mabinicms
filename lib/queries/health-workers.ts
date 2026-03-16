import { createClient } from "@supabase/supabase-js";
import type {
  VaccinationRecord,
  MaternalHealthRecord,
  SeniorAssistanceRecord,
} from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ============================================================================
// VACCINATION RECORDS
// ============================================================================

export async function createVaccinationRecord(
  data: Omit<VaccinationRecord, "id" | "created_at" | "updated_at">,
) {
  try {
    const { data: record, error } = await supabase
      .from("vaccination_records")
      .insert({
        ...data,
        synced: true,
      })
      .select()
      .single();

    if (error) throw error;
    return record as VaccinationRecord;
  } catch (error) {
    console.error("Error creating vaccination record:", error);
    throw error;
  }
}

export async function getVaccinationsByResident(residentId: string) {
  try {
    const { data, error } = await supabase
      .from("vaccination_records")
      .select(
        `
        *,
        residents(id, full_name, barangay),
        users!administered_by(id, username)
      `,
      )
      .eq("resident_id", residentId)
      .order("vaccine_date", { ascending: false });

    if (error) throw error;
    return data as VaccinationRecord[];
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    return [];
  }
}

export async function getVaccinationsByBarangay(barangay: string) {
  try {
    const { data, error } = await supabase
      .from("vaccination_records")
      .select(
        `
        *,
        residents(id, full_name, barangay, purok, contact_number),
        users!administered_by(id, username)
      `,
      )
      .eq("residents.barangay", barangay)
      .order("vaccine_date", { ascending: false });

    if (error) throw error;
    return data as VaccinationRecord[];
  } catch (error) {
    console.error("Error fetching barangay vaccinations:", error);
    return [];
  }
}

export async function updateVaccinationRecord(
  id: string,
  data: Partial<VaccinationRecord>,
) {
  try {
    const { data: record, error } = await supabase
      .from("vaccination_records")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return record as VaccinationRecord;
  } catch (error) {
    console.error("Error updating vaccination record:", error);
    throw error;
  }
}

export async function getVaccinationStats(barangay: string) {
  try {
    const { data: records, error } = await supabase
      .from("vaccination_records")
      .select("status, vaccine_name, residents(id)")
      .eq("residents.barangay", barangay);

    if (error) throw error;

    const stats: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
      by_vaccine: Record<string, number>;
    } = {
      total: records?.length || 0,
      completed:
        records?.filter((r: any) => r.status === "completed").length || 0,
      pending: records?.filter((r: any) => r.status === "pending").length || 0,
      overdue: records?.filter((r: any) => r.status === "overdue").length || 0,
      by_vaccine: {},
    };

    records?.forEach((record: any) => {
      stats.by_vaccine[record.vaccine_name] =
        (stats.by_vaccine[record.vaccine_name] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error fetching vaccination stats:", error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      by_vaccine: {},
    };
  }
}

// ============================================================================
// MATERNAL HEALTH RECORDS
// ============================================================================

export async function createMaternalHealthRecord(
  data: Omit<MaternalHealthRecord, "id" | "created_at" | "updated_at">,
) {
  try {
    const { data: record, error } = await supabase
      .from("health_indicators")
      .insert({
        resident_id: data.resident_id,
        indicator_type: "maternal_health_visit",
        value: 1, // Single recorded maternal visit event
        unit: "visit",
        status: "normal",
        recorded_by: data.recorded_by,
        notes: JSON.stringify({
          ...data,
          visit_date: data.visit_date,
        }),
        synced: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Parse back to maternal health format
    return {
      id: record.id,
      ...data,
      synced: true,
      created_at: record.created_at,
      updated_at: record.updated_at,
    } as MaternalHealthRecord;
  } catch (error) {
    console.error("Error creating maternal health record:", error);
    throw error;
  }
}

export async function getMaternalHealthRecordsByResident(residentId: string) {
  try {
    const { data, error } = await supabase
      .from("health_indicators")
      .select(
        `
        *,
        residents(id, full_name, barangay, birth_date),
        users!recorded_by(id, username)
      `,
      )
      .eq("resident_id", residentId)
      .eq("indicator_type", "maternal_health_visit")
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    // Parse notes back to MaternalHealthRecord format
    return (data || []).map((record: any) => ({
      id: record.id,
      ...JSON.parse(record.notes || "{}"),
      recorded_by: record.recorded_by,
      resident: record.residents,
      recorder: record.users,
      created_at: record.created_at,
      updated_at: record.updated_at,
    })) as MaternalHealthRecord[];
  } catch (error) {
    console.error("Error fetching maternal health records:", error);
    return [];
  }
}

export async function getMaternalHealthRecordsByBarangay(barangay: string) {
  try {
    const { data, error } = await supabase
      .from("health_indicators")
      .select(
        `
        *,
        residents(id, full_name, barangay, birth_date, contact_number),
        users!recorded_by(id, username)
      `,
      )
      .eq("residents.barangay", barangay)
      .eq("indicator_type", "maternal_health_visit")
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      id: record.id,
      ...JSON.parse(record.notes || "{}"),
      recorded_by: record.recorded_by,
      resident: record.residents,
      recorder: record.users,
      created_at: record.created_at,
      updated_at: record.updated_at,
    })) as MaternalHealthRecord[];
  } catch (error) {
    console.error("Error fetching barangay maternal health records:", error);
    return [];
  }
}

export async function getMaternalHealthStats(barangay: string) {
  try {
    const { data: records, error } = await supabase
      .from("health_indicators")
      .select("recorded_at, residents(id)")
      .eq("residents.barangay", barangay)
      .eq("indicator_type", "maternal_health_visit");

    if (error) throw error;

    const uniqueMothers = new Set(
      records?.map((r: any) => r.residents.id) || [],
    ).size;

    return {
      total_visits: records?.length || 0,
      unique_mothers: uniqueMothers,
      visits_this_month:
        records?.filter((r: any) => {
          const date = new Date(r.recorded_at);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        }).length || 0,
    };
  } catch (error) {
    console.error("Error fetching maternal health stats:", error);
    return {
      total_visits: 0,
      unique_mothers: 0,
      visits_this_month: 0,
    };
  }
}

// ============================================================================
// SENIOR CITIZEN ASSISTANCE RECORDS
// ============================================================================

export async function createSeniorAssistanceRecord(
  data: Omit<SeniorAssistanceRecord, "id" | "created_at" | "updated_at">,
) {
  try {
    const { data: record, error } = await supabase
      .from("health_indicators")
      .insert({
        resident_id: data.resident_id,
        indicator_type: "senior_assistance_visit",
        value: 1,
        unit: "visit",
        status: "normal",
        recorded_by: data.recorded_by,
        notes: JSON.stringify(data),
        synced: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: record.id,
      ...data,
      synced: true,
      created_at: record.created_at,
      updated_at: record.updated_at,
    } as SeniorAssistanceRecord;
  } catch (error) {
    console.error("Error creating senior assistance record:", error);
    throw error;
  }
}

export async function getSeniorAssistanceRecordsByResident(residentId: string) {
  try {
    const { data, error } = await supabase
      .from("health_indicators")
      .select(
        `
        *,
        residents(id, full_name, barangay, birth_date),
        users!recorded_by(id, username)
      `,
      )
      .eq("resident_id", residentId)
      .eq("indicator_type", "senior_assistance_visit")
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      id: record.id,
      ...JSON.parse(record.notes || "{}"),
      recorded_by: record.recorded_by,
      resident: record.residents,
      recorder: record.users,
      created_at: record.created_at,
      updated_at: record.updated_at,
    })) as SeniorAssistanceRecord[];
  } catch (error) {
    console.error("Error fetching senior assistance records:", error);
    return [];
  }
}

export async function getSeniorAssistanceRecordsByBarangay(barangay: string) {
  try {
    const { data, error } = await supabase
      .from("health_indicators")
      .select(
        `
        *,
        residents(id, full_name, barangay, birth_date, contact_number),
        users!recorded_by(id, username)
      `,
      )
      .eq("residents.barangay", barangay)
      .eq("indicator_type", "senior_assistance_visit")
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      id: record.id,
      ...JSON.parse(record.notes || "{}"),
      recorded_by: record.recorded_by,
      resident: record.residents,
      recorder: record.users,
      created_at: record.created_at,
      updated_at: record.updated_at,
    })) as SeniorAssistanceRecord[];
  } catch (error) {
    console.error("Error fetching barangay senior assistance records:", error);
    return [];
  }
}

export async function getSeniorAssistanceStats(barangay: string) {
  try {
    const { data: records, error } = await supabase
      .from("health_indicators")
      .select("recorded_at, residents(id)")
      .eq("residents.barangay", barangay)
      .eq("indicator_type", "senior_assistance_visit");

    if (error) throw error;

    const uniqueSeniors = new Set(
      records?.map((r: any) => r.residents.id) || [],
    ).size;

    return {
      total_assistance_visits: records?.length || 0,
      unique_seniors_assisted: uniqueSeniors,
      visits_this_month:
        records?.filter((r: any) => {
          const date = new Date(r.recorded_at);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        }).length || 0,
    };
  } catch (error) {
    console.error("Error fetching senior assistance stats:", error);
    return {
      total_assistance_visits: 0,
      unique_seniors_assisted: 0,
      visits_this_month: 0,
    };
  }
}

// ============================================================================
// BULK SYNC FOR OFFLINE RECORDS
// ============================================================================

export async function syncOfflineRecords(
  records: Array<{
    type: "vaccination" | "maternal_health" | "senior_assistance";
    data: any;
  }>,
) {
  try {
    let vaccinations: any[] = [];
    let maternalRecords: any[] = [];
    let seniorRecords: any[] = [];

    // Separate records by type
    records.forEach((record) => {
      if (record.type === "vaccination") {
        vaccinations.push(record.data);
      } else if (record.type === "maternal_health") {
        maternalRecords.push(record.data);
      } else if (record.type === "senior_assistance") {
        seniorRecords.push(record.data);
      }
    });

    const results: {
      vaccinations: any[];
      maternal: any[];
      senior: any[];
      errors: any[];
    } = { vaccinations: [], maternal: [], senior: [], errors: [] };

    // Sync vaccinations
    if (vaccinations.length > 0) {
      const { data, error } = await supabase
        .from("vaccination_records")
        .insert(vaccinations)
        .select();

      if (!error) {
        results.vaccinations = data || [];
      } else {
        results.errors.push({
          type: "vaccination",
          error: error.message,
        });
      }
    }

    // Sync maternal health records
    if (maternalRecords.length > 0) {
      const { data, error } = await supabase
        .from("health_indicators")
        .insert(
          maternalRecords.map((r) => ({
            resident_id: r.resident_id,
            indicator_type: "maternal_health_visit",
            value: 1,
            unit: "visit",
            status: "normal",
            recorded_by: r.recorded_by,
            notes: JSON.stringify(r),
            synced: true,
          })),
        )
        .select();

      if (!error) {
        results.maternal = data || [];
      } else {
        results.errors.push({
          type: "maternal_health",
          error: error.message,
        });
      }
    }

    // Sync senior assistance records
    if (seniorRecords.length > 0) {
      const { data, error } = await supabase
        .from("health_indicators")
        .insert(
          seniorRecords.map((r) => ({
            resident_id: r.resident_id,
            indicator_type: "senior_assistance_visit",
            value: 1,
            unit: "visit",
            status: "normal",
            recorded_by: r.recorded_by,
            notes: JSON.stringify(r),
            synced: true,
          })),
        )
        .select();

      if (!error) {
        results.senior = data || [];
      } else {
        results.errors.push({
          type: "senior_assistance",
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error syncing offline records:", error);
    throw error;
  }
}
