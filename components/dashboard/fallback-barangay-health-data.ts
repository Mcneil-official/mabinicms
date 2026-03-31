import { MABINI_BARANGAYS } from "@/lib/constants/barangays";

export interface FallbackBarangayHealthRecord {
  barangay: string;
  vaccination_coverage: number;
  pending_interventions: number;
  total_residents: number;
  maternal_health_visits: number;
  senior_citizens_assisted: number;
  last_updated: string;
}

/**
 * Deterministic fallback records for Mabini barangays.
 * This keeps dashboards populated before live records are available.
 */
export const fallbackBarangayHealthData: FallbackBarangayHealthRecord[] =
  MABINI_BARANGAYS.map((barangay, index) => {
    const minute = String(10 + index).padStart(2, "0");

    return {
      barangay,
      vaccination_coverage: Number((58 + ((index * 2.3) % 30)).toFixed(1)),
      pending_interventions: 8 + (index % 20),
      total_residents: 2500 + index * 137,
      maternal_health_visits: 24 + ((index * 3) % 42),
      senior_citizens_assisted: 55 + index * 4,
      last_updated: `2026-03-15T08:${minute}:00+08:00`,
    };
  });
