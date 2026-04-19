/**
 * Core TypeScript types for the Barangay Health Dashboard
 */

export type UserRole =
  | "staff"
  | "barangay"
  | "residence"
  | "workers"
  | "user"
  | "admin";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  assigned_barangay: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  user: User;
  expires_at: number;
}

export interface Resident {
  id: string;
  auth_id?: string;
  barangay: string;
  purok: string;
  full_name: string;
  birth_date?: string;
  sex?: "Male" | "Female" | "Other";
  contact_number?: string;
  philhealth_no?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type SubmissionType =
  | "health_concern"
  | "program_inquiry"
  | "appointment_request"
  | "other";
export type SubmissionStatus = "pending" | "approved" | "returned" | "rejected";

export interface Submission {
  id: string;
  resident_id: string;
  submission_type: SubmissionType;
  program_name?: string;
  description: string;
  remarks?: string;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
  // Populated in queries
  resident?: Resident;
  reviewer?: User;
}

export type MembershipType = "individual" | "family" | "senior" | "pwd";
export type YakakStatus = "pending" | "approved" | "returned" | "rejected";

export interface YakakApplication {
  id: string;
  resident_id?: string;
  resident_name: string;
  barangay: string;
  membership_type: MembershipType;
  philhealth_no?: string;
  status: YakakStatus;
  applied_at: string;
  approved_by?: string;
  approved_at?: string;
  remarks?: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
  // Populated in queries
  resident?: Resident;
  approver?: User;
}

export interface HealthFacility {
  id: string;
  name: string;
  barangay: string;
  address: string;
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  contact_json?: any; // Array of staff contacts or object with phone/email
  general_services?: string;
  specialized_services?: string;
  service_capability?: string;
  yakap_accredited?: boolean;
  is_active?: boolean;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
  deactivation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AppointmentStatus =
  | "available"
  | "booked"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  facility_id: string;
  resident_id?: string;
  appointment_date: string;
  time_slot: string;
  service_type?: string;
  status: AppointmentStatus;
  booked_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FacilitySchedule {
  id: string;
  facility_id: string;
  service_name: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  time_start: string;
  time_end: string;
  created_at: string;
  updated_at: string;
}

export interface PersonnelAvailability {
  id: string;
  facility_id: string;
  personnel_name: string;
  personnel_role: string;
  available_days: number[]; // 0-6
  contact_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type:
    | "submission"
    | "yakap_application"
    | "resident"
    | "facility"
    | "user"
    | "announcement";
  resource_id?: string;
  changes?: Record<string, any>;
  created_at: string;
  // Populated in queries
  user?: User;
}

export type AnnouncementStatus = "draft" | "published";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  created_by?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  target_barangays: string[];
  is_read?: boolean;
  read_at?: string | null;
}

export interface DashboardStats {
  pending_submissions: number;
  pending_yakap: number;
  approved_yakap: number;
  returned_submissions: number;
  total_residents: number;
  total_applications: number;
}

// ============================================================================
// HEALTH WORKERS TYPES
// ============================================================================

export type VaccineStatus = "completed" | "pending" | "overdue";
export type VaccineType =
  | "covid19"
  | "measles"
  | "polio"
  | "dpt"
  | "bcg"
  | "hpv"
  | "other";

export interface VaccinationRecord {
  id: string;
  resident_id: string;
  vaccine_name: string;
  dose_number: number;
  vaccine_date: string; // ISO date
  next_dose_date?: string;
  vaccination_site?: string;
  administered_by: string;
  batch_number?: string;
  status: VaccineStatus;
  notes?: string;
  photo_url?: string;
  synced: boolean; // For offline queue
  created_at: string;
  updated_at: string;
  // Populated in queries
  resident?: Resident;
  administrator?: User;
}

export interface MaternalHealthRecord {
  id: string;
  resident_id: string;
  visit_date: string;
  trimester?: 1 | 2 | 3 | "postpartum";
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  weight?: number;
  height?: number;
  hemoglobin?: number;
  blood_type?: string;
  rh_factor?: "positive" | "negative";
  prenatal_vitamins?: boolean;
  tetanus_toxoid?: boolean;
  iron_supplement?: boolean;
  health_complications?: string;
  notes?: string;
  recorded_by: string;
  next_visit_date?: string;
  photo_url?: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
  // Populated in queries
  resident?: Resident;
  recorder?: User;
}

export interface SeniorAssistanceRecord {
  id: string;
  resident_id: string;
  visit_date: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  blood_glucose?: number;
  weight?: number;
  health_concerns?: string;
  medications?: string;
  mobility_status?: "independent" | "assisted" | "dependent";
  cognitive_status?:
    | "sharp"
    | "mild_impairment"
    | "moderate_impairment"
    | "severe_impairment";
  assistance_type?:
    | "financial"
    | "medical"
    | "home_care"
    | "counseling"
    | "other";
  referral_needed?: boolean;
  referral_to?: string;
  notes?: string;
  recorded_by: string;
  next_visit_date?: string;
  photo_url?: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
  // Populated in queries
  resident?: Resident;
  recorder?: User;
}

export interface OfflineQueueItem {
  id: string; // Local UUID
  type: "vaccination" | "maternal_health" | "senior_assistance";
  data: VaccinationRecord | MaternalHealthRecord | SeniorAssistanceRecord;
  timestamp: number; // Milliseconds
  retryCount: number;
  lastError?: string;
}

export interface HealthWorker {
  id: string;
  user_id: string;
  assigned_barangay: string;
  license_number?: string;
  specialization?: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Populated in queries
  user?: User;
}

// ============================================================================
// QR SCANNER TYPES
// ============================================================================

/** Payload embedded in the MabiniCare-generated QR code */
export interface MabiniCareQRPayload {
  type: "mabinicare_resident";
  v: 1;
  id: string; // resident UUID
  name: string;
  barangay: string;
}

/** Row in qr_scan_logs table */
export interface QrScanLog {
  id: string;
  resident_id: string;
  scanned_by: string;
  scanned_at: string;
  facility_id?: string | null;
  device_info?: string | null;
  notes?: string | null;
  // Populated in queries
  scanner?: User;
  facility?: HealthFacility;
}

/** Aggregated resident profile – all data returned in one call */
export interface ResidentFullProfile {
  resident: Resident;
  appointments: (Appointment & { facility?: HealthFacility })[];
  pregnancyProfiles: PregnancyProfile[];
  yakap: YakakApplication[];
  scanLogs: QrScanLog[];
}

/** Simplified pregnancy profile row for display */
export interface PregnancyProfile {
  id: string;
  resident_id: string;
  visit_date: string;
  lmp?: string | null;
  aog_weeks?: number | null;
  gravida?: number | null;
  para?: number | null;
  risk_level?: string | null;
  attending_midwife?: string | null;
  created_at: string;
  updated_at?: string | null;
}
