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
 * Curated fallback records for Naga City barangays.
 * These records are deterministic and healthcare-focused so dashboards remain useful
 * even before live records are fully populated.
 */
export const fallbackBarangayHealthData: FallbackBarangayHealthRecord[] = [
  { barangay: "Abella", vaccination_coverage: 76.4, pending_interventions: 12, total_residents: 4235, maternal_health_visits: 44, senior_citizens_assisted: 96, last_updated: "2026-03-15T08:10:00+08:00" },
  { barangay: "Bagumbayan Norte", vaccination_coverage: 72.1, pending_interventions: 15, total_residents: 3980, maternal_health_visits: 39, senior_citizens_assisted: 88, last_updated: "2026-03-15T08:12:00+08:00" },
  { barangay: "Bagumbayan Sur", vaccination_coverage: 69.7, pending_interventions: 17, total_residents: 4128, maternal_health_visits: 41, senior_citizens_assisted: 91, last_updated: "2026-03-15T08:13:00+08:00" },
  { barangay: "Balatas", vaccination_coverage: 81.5, pending_interventions: 9, total_residents: 5062, maternal_health_visits: 53, senior_citizens_assisted: 116, last_updated: "2026-03-15T08:15:00+08:00" },
  { barangay: "Calauag", vaccination_coverage: 78.3, pending_interventions: 11, total_residents: 4687, maternal_health_visits: 47, senior_citizens_assisted: 109, last_updated: "2026-03-15T08:16:00+08:00" },
  { barangay: "Cararayan", vaccination_coverage: 64.9, pending_interventions: 22, total_residents: 3521, maternal_health_visits: 36, senior_citizens_assisted: 77, last_updated: "2026-03-15T08:18:00+08:00" },
  { barangay: "Carolina", vaccination_coverage: 67.5, pending_interventions: 19, total_residents: 3386, maternal_health_visits: 35, senior_citizens_assisted: 73, last_updated: "2026-03-15T08:19:00+08:00" },
  { barangay: "Concepcion Pequeña", vaccination_coverage: 83.4, pending_interventions: 8, total_residents: 5214, maternal_health_visits: 56, senior_citizens_assisted: 122, last_updated: "2026-03-15T08:20:00+08:00" },
  { barangay: "Concepcion Grande", vaccination_coverage: 80.1, pending_interventions: 10, total_residents: 5442, maternal_health_visits: 58, senior_citizens_assisted: 130, last_updated: "2026-03-15T08:22:00+08:00" },
  { barangay: "Dayangdang", vaccination_coverage: 74.6, pending_interventions: 14, total_residents: 4598, maternal_health_visits: 48, senior_citizens_assisted: 101, last_updated: "2026-03-15T08:23:00+08:00" },
  { barangay: "Del Rosario", vaccination_coverage: 70.8, pending_interventions: 16, total_residents: 4369, maternal_health_visits: 42, senior_citizens_assisted: 97, last_updated: "2026-03-15T08:24:00+08:00" },
  { barangay: "Dinaga", vaccination_coverage: 61.7, pending_interventions: 24, total_residents: 3015, maternal_health_visits: 29, senior_citizens_assisted: 68, last_updated: "2026-03-15T08:26:00+08:00" },
  { barangay: "Igualdad Interior", vaccination_coverage: 66.2, pending_interventions: 20, total_residents: 3298, maternal_health_visits: 31, senior_citizens_assisted: 72, last_updated: "2026-03-15T08:27:00+08:00" },
  { barangay: "Lerma", vaccination_coverage: 73.5, pending_interventions: 13, total_residents: 4137, maternal_health_visits: 40, senior_citizens_assisted: 90, last_updated: "2026-03-15T08:28:00+08:00" },
  { barangay: "Liboton", vaccination_coverage: 68.4, pending_interventions: 18, total_residents: 3874, maternal_health_visits: 37, senior_citizens_assisted: 84, last_updated: "2026-03-15T08:30:00+08:00" },
  { barangay: "Mabolo", vaccination_coverage: 82.7, pending_interventions: 8, total_residents: 5621, maternal_health_visits: 60, senior_citizens_assisted: 136, last_updated: "2026-03-15T08:31:00+08:00" },
  { barangay: "Pangpang", vaccination_coverage: 65.6, pending_interventions: 21, total_residents: 3466, maternal_health_visits: 34, senior_citizens_assisted: 76, last_updated: "2026-03-15T08:32:00+08:00" },
  { barangay: "Panicuason", vaccination_coverage: 58.9, pending_interventions: 27, total_residents: 2750, maternal_health_visits: 25, senior_citizens_assisted: 63, last_updated: "2026-03-15T08:34:00+08:00" },
  { barangay: "Peñafrancia", vaccination_coverage: 79.2, pending_interventions: 11, total_residents: 4882, maternal_health_visits: 50, senior_citizens_assisted: 111, last_updated: "2026-03-15T08:35:00+08:00" },
  { barangay: "Sabang", vaccination_coverage: 63.1, pending_interventions: 23, total_residents: 3214, maternal_health_visits: 30, senior_citizens_assisted: 69, last_updated: "2026-03-15T08:36:00+08:00" },
  { barangay: "San Felipe", vaccination_coverage: 77.8, pending_interventions: 12, total_residents: 4715, maternal_health_visits: 49, senior_citizens_assisted: 108, last_updated: "2026-03-15T08:38:00+08:00" },
  { barangay: "San Francisco (Poblacion)", vaccination_coverage: 84.1, pending_interventions: 7, total_residents: 5932, maternal_health_visits: 66, senior_citizens_assisted: 142, last_updated: "2026-03-15T08:39:00+08:00" },
  { barangay: "San Isidro", vaccination_coverage: 71.3, pending_interventions: 15, total_residents: 4258, maternal_health_visits: 43, senior_citizens_assisted: 92, last_updated: "2026-03-15T08:40:00+08:00" },
  { barangay: "Santa Cruz", vaccination_coverage: 75.9, pending_interventions: 13, total_residents: 4521, maternal_health_visits: 46, senior_citizens_assisted: 103, last_updated: "2026-03-15T08:42:00+08:00" },
  { barangay: "Santo Niño", vaccination_coverage: 62.4, pending_interventions: 25, total_residents: 3148, maternal_health_visits: 28, senior_citizens_assisted: 67, last_updated: "2026-03-15T08:43:00+08:00" },
  { barangay: "Tabuco", vaccination_coverage: 74.1, pending_interventions: 14, total_residents: 4387, maternal_health_visits: 45, senior_citizens_assisted: 99, last_updated: "2026-03-15T08:44:00+08:00" },
  { barangay: "Triangulo", vaccination_coverage: 81.9, pending_interventions: 9, total_residents: 5174, maternal_health_visits: 55, senior_citizens_assisted: 124, last_updated: "2026-03-15T08:46:00+08:00" },
];
