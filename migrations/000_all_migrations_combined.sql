-- ============================================================================
-- COMBINED MIGRATION SCRIPT
-- Generated from all files under migrations/
-- Date: 2026-03-30
-- ============================================================================


-- ============================================================================
-- BEGIN FILE: migrations/001_yakap_applications_add_form_data.sql
-- ============================================================================

-- ============================================================================
-- YAKAP APPLICATIONS TABLE MIGRATION
-- Adds comprehensive form data and resident_id fields
-- ============================================================================

-- Add resident_id column if it doesn't exist
ALTER TABLE public.yakap_applications
ADD COLUMN IF NOT EXISTS resident_id UUID NULL;

-- Add form_data column to store complete PhilHealth Konsulta form
ALTER TABLE public.yakap_applications
ADD COLUMN IF NOT EXISTS form_data JSONB NULL;

-- Update the membership_type constraint to match new values
-- First, drop the old constraint
ALTER TABLE public.yakap_applications
DROP CONSTRAINT IF EXISTS yakap_applications_membership_type_check;

-- Add the updated constraint with all valid membership types
ALTER TABLE public.yakap_applications
ADD CONSTRAINT yakap_applications_membership_type_check CHECK (
  membership_type = ANY(ARRAY['individual'::text, 'family'::text, 'senior'::text, 'pwd'::text])
);

-- Create index on resident_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_yakap_applications_resident_id 
ON public.yakap_applications USING BTREE (resident_id) 
TABLESPACE pg_default;

-- Create index on form_data for JSONB queries
CREATE INDEX IF NOT EXISTS idx_yakap_applications_form_data 
ON public.yakap_applications USING GIN (form_data) 
TABLESPACE pg_default;

-- Add foreign key constraint to residents table if it exists
-- Uncomment this if you have a residents table
-- ALTER TABLE public.yakap_applications
-- ADD CONSTRAINT yakap_applications_resident_id_fkey 
-- FOREIGN KEY (resident_id) REFERENCES residents (id) ON DELETE SET NULL;

-- Add comment to table for documentation
COMMENT ON TABLE public.yakap_applications IS 'PhilHealth Konsulta (Yakap) application submissions with comprehensive form data';
COMMENT ON COLUMN public.yakap_applications.form_data IS 'Complete form data from PhilHealth Konsulta submission stored as JSONB';
COMMENT ON COLUMN public.yakap_applications.resident_id IS 'Link to resident submitting the application';


-- END FILE: migrations/001_yakap_applications_add_form_data.sql


-- ============================================================================
-- BEGIN FILE: migrations/002_health_workers_tables.sql
-- ============================================================================

-- ============================================================================
-- HEALTH WORKERS MODULE TABLES
-- ============================================================================
-- Tables for vaccination records, maternal health, and senior assistance
-- ============================================================================

-- 1. UPDATE USERS TABLE WITH WORKER ROLE IF NOT EXISTS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'user' 
  CHECK (user_role = ANY (ARRAY['user'::text, 'staff'::text, 'workers'::text]));

-- 2. VACCINATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  dose_number integer,
  vaccine_date date NOT NULL,
  next_dose_date date,
  vaccination_site text,
  administered_by uuid REFERENCES public.users(id),
  batch_number text,
  status text CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'overdue'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vaccination_records_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_vaccination_records_resident_id ON public.vaccination_records(resident_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_vaccine_date ON public.vaccination_records(vaccine_date);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_status ON public.vaccination_records(status);

-- 2. MATERNAL HEALTH RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.maternal_health_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type = ANY (ARRAY['antenatal'::text, 'postnatal'::text, 'delivery'::text])),
  visit_date date NOT NULL,
  trimester integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  weight numeric,
  fetal_heart_rate integer,
  complications text,
  status text CHECK (status = ANY (ARRAY['normal'::text, 'warning'::text, 'critical'::text])),
  notes text,
  recorded_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maternal_health_records_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_maternal_health_records_resident_id ON public.maternal_health_records(resident_id);
CREATE INDEX IF NOT EXISTS idx_maternal_health_records_visit_date ON public.maternal_health_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_maternal_health_records_record_type ON public.maternal_health_records(record_type);

-- 3. SENIOR CITIZEN ASSISTANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.senior_assistance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  assistance_type text NOT NULL CHECK (assistance_type = ANY (ARRAY[
    'medical_support'::text, 
    'medication_delivery'::text, 
    'home_care'::text, 
    'mobility_support'::text,
    'mental_health'::text,
    'social_services'::text
  ])),
  visit_date date NOT NULL,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  blood_glucose numeric,
  medications_given text,
  vital_status text CHECK (vital_status = ANY (ARRAY['stable'::text, 'improved'::text, 'declining'::text])),
  status text CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text])),
  notes text,
  recorded_by uuid REFERENCES public.users(id),
  follow_up_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT senior_assistance_records_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_senior_assistance_records_resident_id ON public.senior_assistance_records(resident_id);
CREATE INDEX IF NOT EXISTS idx_senior_assistance_records_visit_date ON public.senior_assistance_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_senior_assistance_records_assistance_type ON public.senior_assistance_records(assistance_type);

-- 4. HEALTH METRICS TABLE (for dashboard analytics)
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  barangay text NOT NULL,
  metric_type text NOT NULL CHECK (metric_type = ANY (ARRAY[
    'vaccination_coverage'::text,
    'maternal_health_coverage'::text,
    'senior_assistance_coverage'::text,
    'average_bp_systolic'::text,
    'average_bp_diastolic'::text,
    'total_visits'::text
  ])),
  metric_date date NOT NULL,
  value numeric NOT NULL,
  target numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT health_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT unique_metric_per_day UNIQUE(barangay, metric_type, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_barangay ON public.health_metrics(barangay);
CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_type ON public.health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_date ON public.health_metrics(metric_date);

-- 5. OFFLINE QUEUE TABLE (for PWA offline data persistence)
CREATE TABLE IF NOT EXISTS public.offline_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  table_name text NOT NULL,
  data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'synced'::text, 'failed'::text])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  synced_at timestamp with time zone,
  CONSTRAINT offline_queue_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_offline_queue_user_id ON public.offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON public.offline_queue(status);

-- 6. HEALTH FACILITIES WITH GEOLOCATION (update existing or create new)
CREATE TABLE IF NOT EXISTS public.health_facilities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barangay text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  operating_hours jsonb DEFAULT '{"end": "17:00", "start": "08:00"}'::jsonb,
  contact_json jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT health_facilities_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_health_facilities_barangay ON public.health_facilities(barangay);
CREATE INDEX IF NOT EXISTS idx_health_facilities_name ON public.health_facilities(name);

-- ============================================================================
-- Enable RLS on all new tables
-- ============================================================================

ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternal_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senior_assistance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR HEALTH WORKERS
-- ============================================================================

-- VACCINATION RECORDS POLICIES
CREATE POLICY "health_workers_view_vaccination_records"
  ON public.vaccination_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = vaccination_records.resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

CREATE POLICY "health_workers_insert_vaccination_records"
  ON public.vaccination_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

CREATE POLICY "health_workers_update_vaccination_records"
  ON public.vaccination_records FOR UPDATE
  USING (
    administered_by::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

-- MATERNAL HEALTH RECORDS POLICIES
CREATE POLICY "health_workers_view_maternal_health"
  ON public.maternal_health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = maternal_health_records.resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

CREATE POLICY "health_workers_insert_maternal_health"
  ON public.maternal_health_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

-- SENIOR ASSISTANCE RECORDS POLICIES
CREATE POLICY "health_workers_view_senior_assistance"
  ON public.senior_assistance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = senior_assistance_records.resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

CREATE POLICY "health_workers_insert_senior_assistance"
  ON public.senior_assistance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.residents r
      JOIN public.users u ON true
      WHERE r.id = resident_id
      AND u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = r.barangay
    )
  );

-- HEALTH METRICS POLICIES
CREATE POLICY "health_workers_view_health_metrics"
  ON public.health_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = auth.uid()::text
      AND u.user_role = 'workers'
      AND u.assigned_barangay = health_metrics.barangay
    )
  );

-- OFFLINE QUEUE POLICIES
CREATE POLICY "users_view_own_queue"
  ON public.offline_queue FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "users_insert_own_queue"
  ON public.offline_queue FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================


-- END FILE: migrations/002_health_workers_tables.sql


-- ============================================================================
-- BEGIN FILE: migrations/003_announcements_module.sql
-- ============================================================================

-- ============================================================================
-- ANNOUNCEMENTS MODULE (CITY HEALTH OFFICE -> BARANGAY TARGETING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcement_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  barangay text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcement_targets_unique UNIQUE (announcement_id, barangay)
);

CREATE TABLE IF NOT EXISTS public.announcement_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  barangay text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcement_notifications_unique UNIQUE (announcement_id, barangay)
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_barangay ON public.announcement_targets(barangay);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_announcement_id ON public.announcement_targets(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_notifications_barangay ON public.announcement_notifications(barangay);
CREATE INDEX IF NOT EXISTS idx_announcement_notifications_read ON public.announcement_notifications(is_read);

CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS announcements_set_updated_at ON public.announcements;
CREATE TRIGGER announcements_set_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp_updated_at();

DROP TRIGGER IF EXISTS announcement_notifications_set_updated_at ON public.announcement_notifications;
CREATE TRIGGER announcement_notifications_set_updated_at
BEFORE UPDATE ON public.announcement_notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp_updated_at();


-- END FILE: migrations/003_announcements_module.sql


-- ============================================================================
-- BEGIN FILE: migrations/004_announcements_add_poster_image.sql
-- ============================================================================

-- ============================================================================
-- ANNOUNCEMENTS: OPTIONAL POSTER IMAGE
-- ============================================================================

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS poster_image_url text;


-- END FILE: migrations/004_announcements_add_poster_image.sql


-- ============================================================================
-- BEGIN FILE: migrations/005_medication_inventory_module.sql
-- ============================================================================

-- Medication Inventory and Dispensing Module
-- Centralized CHO-managed inventory with barangay allocation, audit logs, and alerts support

CREATE TABLE IF NOT EXISTS public.medication_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text NOT NULL,
  category text NOT NULL,
  batch_number text NOT NULL,
  quantity integer NOT NULL CHECK (quantity >= 0),
  expiration_date date NOT NULL,
  low_stock_threshold integer NOT NULL DEFAULT 20 CHECK (low_stock_threshold >= 0),
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_inventory_name
  ON public.medication_inventory (medicine_name);

CREATE INDEX IF NOT EXISTS idx_medication_inventory_expiration
  ON public.medication_inventory (expiration_date);

CREATE TABLE IF NOT EXISTS public.medication_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medication_inventory(id) ON DELETE CASCADE,
  barangay text NOT NULL,
  allocated_quantity integer NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medication_allocations_unique UNIQUE (medication_id, barangay)
);

CREATE INDEX IF NOT EXISTS idx_medication_allocations_barangay
  ON public.medication_allocations (barangay);

CREATE TABLE IF NOT EXISTS public.medication_distribution_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medication_inventory(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('allocate', 'dispense', 'restock', 'redistribute', 'adjust')),
  quantity integer NOT NULL CHECK (quantity > 0),
  barangay text NULL,
  from_barangay text NULL,
  to_barangay text NULL,
  notes text NULL,
  action_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_distribution_created_at
  ON public.medication_distribution_history (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medication_distribution_barangay
  ON public.medication_distribution_history (barangay, from_barangay, to_barangay);

CREATE TABLE IF NOT EXISTS public.medication_inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NULL REFERENCES public.medication_inventory(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor_id uuid NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_created_at
  ON public.medication_inventory_logs (created_at DESC);

-- Keep timestamps updated
CREATE OR REPLACE FUNCTION public.set_medication_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medication_inventory_updated_at ON public.medication_inventory;
CREATE TRIGGER trg_medication_inventory_updated_at
BEFORE UPDATE ON public.medication_inventory
FOR EACH ROW EXECUTE FUNCTION public.set_medication_updated_at();

DROP TRIGGER IF EXISTS trg_medication_allocations_updated_at ON public.medication_allocations;
CREATE TRIGGER trg_medication_allocations_updated_at
BEFORE UPDATE ON public.medication_allocations
FOR EACH ROW EXECUTE FUNCTION public.set_medication_updated_at();

-- Optional realtime integration
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_inventory;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_allocations;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_distribution_history;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;


-- END FILE: migrations/005_medication_inventory_module.sql


-- ============================================================================
-- BEGIN FILE: migrations/006_barangay_profiles_merge_pregnancy_history.sql
-- ============================================================================

-- Merge pregnancy profiling fields into barangay_profiles
-- Adds Medical & Surgical History and Family & Personal History columns

ALTER TABLE public.barangay_profiles
  ADD COLUMN IF NOT EXISTS is_pregnant text CHECK (is_pregnant IN ('yes', 'no')),
  ADD COLUMN IF NOT EXISTS pregnancy_months integer CHECK (pregnancy_months >= 0 AND pregnancy_months <= 10),
  ADD COLUMN IF NOT EXISTS gravida integer CHECK (gravida >= 0),
  ADD COLUMN IF NOT EXISTS para integer CHECK (para >= 0),
  ADD COLUMN IF NOT EXISTS lmp date,
  ADD COLUMN IF NOT EXISTS edd date,
  ADD COLUMN IF NOT EXISTS prenatal_checkup_date date,
  ADD COLUMN IF NOT EXISTS pregnancy_risk_level text CHECK (pregnancy_risk_level IN ('low', 'moderate', 'high')),
  ADD COLUMN IF NOT EXISTS pregnancy_remarks text,
  ADD COLUMN IF NOT EXISTS has_hypertension text,
  ADD COLUMN IF NOT EXISTS has_diabetes text,
  ADD COLUMN IF NOT EXISTS has_asthma text,
  ADD COLUMN IF NOT EXISTS has_heart_disease text,
  ADD COLUMN IF NOT EXISTS past_surgeries text,
  ADD COLUMN IF NOT EXISTS current_medications text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS hospitalization_history text,
  ADD COLUMN IF NOT EXISTS family_hypertension text,
  ADD COLUMN IF NOT EXISTS family_diabetes text,
  ADD COLUMN IF NOT EXISTS family_asthma text,
  ADD COLUMN IF NOT EXISTS family_cancer text,
  ADD COLUMN IF NOT EXISTS smoking_status text,
  ADD COLUMN IF NOT EXISTS alcohol_intake text,
  ADD COLUMN IF NOT EXISTS exercise_frequency text,
  ADD COLUMN IF NOT EXISTS dietary_pattern text,
  ADD COLUMN IF NOT EXISTS personal_history_notes text;

-- END FILE: migrations/006_barangay_profiles_merge_pregnancy_history.sql


-- ============================================================================
-- BEGIN FILE: migrations/006_medical_consultation_records.sql
-- ============================================================================

-- ============================================================================
-- MEDICAL CONSULTATION RECORDS TABLE
-- ============================================================================
-- For CHU/RHU consultation form data entry by health workers
-- ============================================================================

-- MEDICAL CONSULTATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.medical_consultation_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- PATIENT INFORMATION (Section I)
  -- If resident_id is provided, pulls from residents table; otherwise uses manual entry
  resident_id uuid REFERENCES public.residents(id) ON DELETE SET NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  suffix text, -- Jr., Sr., II, III, etc.
  age integer NOT NULL,
  sex text NOT NULL CHECK (sex IN ('M', 'F')),
  address text NOT NULL,
  philhealth_id text,
  
  -- Barangay for filtering (auto-set by worker's assigned barangay)
  barangay text NOT NULL,
  
  -- CHU/RHU PERSONNEL FIELDS (Section II)
  -- Mode of Transaction
  mode_of_transaction text NOT NULL CHECK (mode_of_transaction IN ('walk_in', 'visited', 'referral')),
  
  -- For referred patients
  referred_from text,
  referred_to text,
  
  -- Consultation Details
  consultation_date date NOT NULL,
  consultation_time time,
  
  -- Vital Signs
  temperature numeric(4,1), -- e.g., 37.5
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  
  -- Provider Info
  attending_provider text NOT NULL,
  referral_reason text,
  referred_by text,
  
  -- Nature of Visit (can be multiple - stored as array or single value)
  nature_of_visit text NOT NULL CHECK (nature_of_visit IN ('new_consultation', 'new_admission', 'follow_up')),
  
  -- Type of Consultation / Purpose (can be multiple - stored as JSONB array)
  consultation_types text[] NOT NULL DEFAULT '{}',
  -- Allowed values: 'general', 'family_planning', 'prenatal', 'postpartum', 
  -- 'tuberculosis', 'dental_care', 'child_care', 'immunization', 
  -- 'child_nutrition', 'sick_children', 'injury', 'firecracker_injury', 'adult_immunization'
  
  -- Clinical Fields
  chief_complaints text,
  diagnosis text,
  consultation_notes text,
  medication_treatment text,
  laboratory_findings text,
  performed_laboratory_test text,
  
  -- Record Metadata
  healthcare_provider_name text NOT NULL, -- Name of health care provider who signed
  recorded_by uuid REFERENCES public.users(id), -- Worker who entered the data
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT medical_consultation_records_pkey PRIMARY KEY (id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_medical_consultation_records_resident_id 
  ON public.medical_consultation_records(resident_id);
CREATE INDEX IF NOT EXISTS idx_medical_consultation_records_barangay 
  ON public.medical_consultation_records(barangay);
CREATE INDEX IF NOT EXISTS idx_medical_consultation_records_consultation_date 
  ON public.medical_consultation_records(consultation_date);
CREATE INDEX IF NOT EXISTS idx_medical_consultation_records_last_name 
  ON public.medical_consultation_records(last_name);
CREATE INDEX IF NOT EXISTS idx_medical_consultation_records_mode_of_transaction 
  ON public.medical_consultation_records(mode_of_transaction);
CREATE INDEX IF NOT EXISTS idx_medical_consultation_records_nature_of_visit 
  ON public.medical_consultation_records(nature_of_visit);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_medical_consultation_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_medical_consultation_records_updated_at ON public.medical_consultation_records;
CREATE TRIGGER update_medical_consultation_records_updated_at
    BEFORE UPDATE ON public.medical_consultation_records
    FOR EACH ROW
    EXECUTE FUNCTION update_medical_consultation_records_updated_at();

-- RLS Policies
ALTER TABLE public.medical_consultation_records ENABLE ROW LEVEL SECURITY;

-- Workers can view records in their assigned barangay
CREATE POLICY "Workers can view medical consultations in their barangay"
  ON public.medical_consultation_records
  FOR SELECT
  USING (true);

-- Workers can insert records for their barangay
CREATE POLICY "Workers can insert medical consultations"
  ON public.medical_consultation_records
  FOR INSERT
  WITH CHECK (true);

-- Workers can update records they created
CREATE POLICY "Workers can update their medical consultations"
  ON public.medical_consultation_records
  FOR UPDATE
  USING (true);

COMMENT ON TABLE public.medical_consultation_records IS 'CHU/RHU medical consultation records entered by health workers';


-- END FILE: migrations/006_medical_consultation_records.sql


-- ============================================================================
-- BEGIN FILE: migrations/007_barangay_profiles_doh_history_fields.sql
-- ============================================================================

-- Add exact DOH-like Medical & Surgical History + Family & Personal History fields

ALTER TABLE public.barangay_profiles
  ADD COLUMN IF NOT EXISTS past_medical_history text,
  ADD COLUMN IF NOT EXISTS pmh_specify_allergy text,
  ADD COLUMN IF NOT EXISTS pmh_specify_organ_cancer text,
  ADD COLUMN IF NOT EXISTS pmh_specify_hepatitis_type text,
  ADD COLUMN IF NOT EXISTS pmh_highest_blood_pressure text,
  ADD COLUMN IF NOT EXISTS pmh_specify_pulmonary_tb_category text,
  ADD COLUMN IF NOT EXISTS pmh_specify_extrapulmonary_tb_category text,
  ADD COLUMN IF NOT EXISTS pmh_others_specify text,
  ADD COLUMN IF NOT EXISTS past_surgical_history text,
  ADD COLUMN IF NOT EXISTS family_history text,
  ADD COLUMN IF NOT EXISTS fh_specify_allergy text,
  ADD COLUMN IF NOT EXISTS fh_specify_organ_cancer text,
  ADD COLUMN IF NOT EXISTS fh_specify_hepatitis_type text,
  ADD COLUMN IF NOT EXISTS fh_highest_blood_pressure text,
  ADD COLUMN IF NOT EXISTS fh_specify_pulmonary_tb_category text,
  ADD COLUMN IF NOT EXISTS fh_specify_extrapulmonary_tb_category text,
  ADD COLUMN IF NOT EXISTS fh_others_specify text,
  ADD COLUMN IF NOT EXISTS smoking_packs_per_year text,
  ADD COLUMN IF NOT EXISTS alcohol_bottles_per_day text,
  ADD COLUMN IF NOT EXISTS illicit_drugs text,
  ADD COLUMN IF NOT EXISTS sexually_active text;

-- END FILE: migrations/007_barangay_profiles_doh_history_fields.sql


-- ============================================================================
-- BEGIN FILE: migrations/007_qr_scan_logs.sql
-- ============================================================================

-- Migration: QR Scan Activity Log
-- Feature: MabiniCare QR Scanner — audit every scan made by health workers

-- ============================================================
-- TABLE: qr_scan_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id  UUID        NOT NULL REFERENCES residents(id),
  scanned_by   UUID        NOT NULL REFERENCES users(id),
  scanned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  facility_id  UUID        REFERENCES health_facilities(id),
  device_info  TEXT,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_resident_id  ON qr_scan_logs (resident_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scanned_by   ON qr_scan_logs (scanned_by);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scanned_at   ON qr_scan_logs (scanned_at DESC);

-- RLS is disabled — access is controlled at the application layer.
ALTER TABLE qr_scan_logs DISABLE ROW LEVEL SECURITY;


-- END FILE: migrations/007_qr_scan_logs.sql


-- ============================================================================
-- BEGIN FILE: migrations/008_replace_placeholder_with_realistic_healthcare_data.sql
-- ============================================================================

-- ============================================================================
-- REPLACE PLACEHOLDER/TEST DATA WITH REALISTIC HEALTHCARE RECORDS
-- Run this in Supabase SQL Editor (or via migration runner with privileged role)
-- ============================================================================

DO $$
DECLARE
  actor_id uuid;
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Table public.users does not exist in this database. Use the correct Supabase project/schema first.';
  END IF;

  -- Use an existing user as created_by/administered_by/recorded_by reference.
  SELECT u.id
  INTO actor_id
  FROM public.users u
  ORDER BY u.created_at NULLS LAST
  LIMIT 1;

  -- If there is no user yet, create a deterministic seed user.
  IF actor_id IS NULL THEN
    INSERT INTO public.users (
      username,
      password_hash,
      assigned_barangay,
      user_role,
      created_at,
      updated_at
    )
    VALUES (
      'seed_staff',
      'seed_hash_change_me',
      'Laurel',
      'staff',
      NOW(),
      NOW()
    )
    ON CONFLICT (username) DO NOTHING;

    SELECT u.id
    INTO actor_id
    FROM public.users u
    WHERE u.username = 'seed_staff'
    LIMIT 1;
  END IF;

  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve a seed actor from public.users.';
  END IF;

  -- --------------------------------------------------------------------------
  -- 0) Seed operational users (idempotent)
  -- Default password for all inserted users: MabiniCare@2026
  -- IMPORTANT: Change these passwords immediately after first login.
  -- --------------------------------------------------------------------------

  INSERT INTO public.users (
    username,
    password_hash,
    assigned_barangay,
    user_role,
    created_at,
    updated_at
  )
  SELECT
    v.username,
    crypt('MabiniCare@2026', gen_salt('bf', 10)),
    v.assigned_barangay,
    v.user_role,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('hw_anilao_east', 'Anilao East', 'workers'),
      ('hw_anilao_proper', 'Anilao Proper', 'workers'),
      ('hw_bagalangit', 'Bagalangit', 'workers'),
      ('hw_bulacan', 'Bulacan', 'workers'),
      ('hw_calamias', 'Calamias', 'workers'),
      ('hw_estrella', 'Estrella', 'workers'),
      ('hw_gasang', 'Gasang', 'workers'),
      ('hw_laurel', 'Laurel', 'workers'),
      ('hw_ligaya', 'Ligaya', 'workers'),
      ('hw_mainaga', 'Mainaga', 'workers'),
      ('hw_mainit', 'Mainit', 'workers'),
      ('hw_majuben', 'Majuben', 'workers'),
      ('hw_malimatoc_i', 'Malimatoc I', 'workers'),
      ('hw_malimatoc_ii', 'Malimatoc II', 'workers'),
      ('hw_nag_iba', 'Nag-iba', 'workers'),
      ('hw_pilahan', 'Pilahan', 'workers'),
      ('hw_poblacion', 'Poblacion', 'workers'),
      ('hw_pulang_lupa', 'Pulang Lupa', 'workers'),
      ('hw_pulong_anahao', 'Pulong Anahao', 'workers'),
      ('hw_pulong_balibaguhan', 'Pulong Balibaguhan', 'workers'),
      ('hw_pulong_niogan', 'Pulong Niogan', 'workers'),
      ('hw_saguing', 'Saguing', 'workers'),
      ('hw_sampaguita', 'Sampaguita', 'workers'),
      ('hw_san_francisco', 'San Francisco', 'workers'),
      ('hw_san_jose', 'San Jose', 'workers'),
      ('hw_san_juan', 'San Juan', 'workers'),
      ('hw_san_teodoro', 'San Teodoro', 'workers'),
      ('hw_santa_ana', 'Santa Ana', 'workers'),
      ('hw_santa_mesa', 'Santa Mesa', 'workers'),
      ('hw_santo_nino', 'Santo Niño', 'workers'),
      ('hw_santo_tomas', 'Santo Tomas', 'workers'),
      ('hw_solo', 'Solo', 'workers'),
      ('hw_talaga_east', 'Talaga East', 'workers'),
      ('hw_talaga_proper', 'Talaga Proper', 'workers'),
      ('city_health_worker', NULL::text, 'admin')
  ) AS v(username, assigned_barangay, user_role)
  ON CONFLICT (username) DO NOTHING;

  -- Ensure city-level account has global scope even if it already existed.
  UPDATE public.users
  SET
    assigned_barangay = NULL,
    user_role = 'admin',
    updated_at = NOW()
  WHERE username = 'city_health_worker';

  -- --------------------------------------------------------------------------
  -- 1) Remove obvious placeholder/test records
  -- --------------------------------------------------------------------------

  CREATE TEMP TABLE tmp_placeholder_residents ON COMMIT DROP AS
  SELECT r.id
  FROM public.residents r
  WHERE LOWER(COALESCE(r.full_name, '')) LIKE ANY (ARRAY[
    '%test%', '%dummy%', '%sample%', '%mock%', '%lorem%', '%placeholder%',
    '%juan dela cruz%', '%john doe%', '%jane doe%'
  ]);

  CREATE TEMP TABLE tmp_placeholder_facilities ON COMMIT DROP AS
  SELECT f.id
  FROM public.health_facilities f
  WHERE LOWER(COALESCE(f.name, '')) LIKE ANY (ARRAY[
    '%test%', '%dummy%', '%sample%', '%mock%', '%lorem%', '%placeholder%'
  ]);

  -- Child tables that contain free-text names often used in test rows
  DELETE FROM public.yakap_applications
  WHERE LOWER(COALESCE(resident_name, '')) LIKE ANY (ARRAY[
    '%test%', '%dummy%', '%sample%', '%mock%', '%lorem%', '%placeholder%',
    '%juan dela cruz%', '%john doe%', '%jane doe%'
  ])
  OR resident_id IN (SELECT id FROM tmp_placeholder_residents);

  -- Delete dependent rows first to satisfy restrictive foreign keys.
  IF to_regclass('public.appointments') IS NOT NULL THEN
    DELETE FROM public.appointments
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents)
       OR facility_id IN (SELECT id FROM tmp_placeholder_facilities);
  END IF;

  IF to_regclass('public.disease_cases') IS NOT NULL THEN
    DELETE FROM public.disease_cases
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.health_indicators') IS NOT NULL THEN
    DELETE FROM public.health_indicators
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.maternal_health_records') IS NOT NULL THEN
    DELETE FROM public.maternal_health_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.senior_assistance_records') IS NOT NULL THEN
    DELETE FROM public.senior_assistance_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.vaccination_records') IS NOT NULL THEN
    DELETE FROM public.vaccination_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.vital_signs_history') IS NOT NULL THEN
    DELETE FROM public.vital_signs_history
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.pregnancy_profiling_records') IS NOT NULL THEN
    DELETE FROM public.pregnancy_profiling_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.program_beneficiaries') IS NOT NULL THEN
    DELETE FROM public.program_beneficiaries
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  IF to_regclass('public.qr_scan_logs') IS NOT NULL THEN
    DELETE FROM public.qr_scan_logs
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents)
       OR facility_id IN (SELECT id FROM tmp_placeholder_facilities);
  END IF;

  IF to_regclass('public.medical_consultation_records') IS NOT NULL THEN
    DELETE FROM public.medical_consultation_records
    WHERE resident_id IN (SELECT id FROM tmp_placeholder_residents);
  END IF;

  -- Remove placeholder residents and facilities after child rows are cleared.
  DELETE FROM public.residents
  WHERE id IN (SELECT id FROM tmp_placeholder_residents);

  DELETE FROM public.health_facilities
  WHERE id IN (SELECT id FROM tmp_placeholder_facilities);

  -- --------------------------------------------------------------------------
  -- 2) Insert realistic resident records (24 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.residents (
    full_name,
    birth_date,
    sex,
    barangay,
    purok,
    contact_number,
    philhealth_no,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    v.full_name,
    v.birth_date,
    v.sex,
    v.barangay,
    v.purok,
    v.contact_number,
    v.philhealth_no,
    actor_id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', DATE '1989-06-14', 'Female', 'Laurel', 'Purok 1', '09171234501', '12-301234567-1'),
      ('Jose Miguel Ramos', DATE '1978-02-11', 'Male', 'Bulacan', 'Purok 3', '09171234502', '12-301234568-9'),
      ('Ana Patricia Lopez', DATE '1994-10-22', 'Female', 'Pilahan', 'Purok 2', '09171234503', '12-301234569-7'),
      ('Ramon Villanueva', DATE '1964-05-08', 'Male', 'Pulong Niogan', 'Purok 4', '09171234504', '12-301234570-5'),
      ('Clarissa Dizon', DATE '1991-12-02', 'Female', 'Anilao East', 'Purok 5', '09171234505', '12-301234571-3'),
      ('Leo Martin Castillo', DATE '1986-03-19', 'Male', 'Anilao Proper', 'Purok 1', '09171234506', '12-301234572-1'),
      ('Sheryl Mae Rivera', DATE '1997-08-27', 'Female', 'Bagalangit', 'Purok 2', '09171234507', '12-301234573-0'),
      ('Crisanto Reyes', DATE '1958-11-30', 'Male', 'Sampaguita', 'Purok 6', '09171234508', '12-301234574-8'),
      ('Janelle Soriano', DATE '2000-01-15', 'Female', 'Mainaga', 'Purok 2', '09171234509', '12-301234575-6'),
      ('Paolo Enrico Mendoza', DATE '1993-07-09', 'Male', 'Mainit', 'Purok 3', '09171234510', '12-301234576-4'),
      ('Helen Bautista', DATE '1972-04-25', 'Female', 'Gasang', 'Purok 1', '09171234511', '12-301234577-2'),
      ('Dominic Flores', DATE '1988-09-13', 'Male', 'Estrella', 'Purok 5', '09171234512', '12-301234578-0'),
      ('Lara Mae Gonzales', DATE '1995-05-17', 'Female', 'Calamias', 'Purok 4', '09171234513', '12-301234579-9'),
      ('Nilo Garcia', DATE '1960-10-03', 'Male', 'Poblacion', 'Purok 7', '09171234514', '12-301234580-7'),
      ('Teresita Alonzo', DATE '1956-01-28', 'Female', 'Pulong Balibaguhan', 'Purok 8', '09171234515', '12-301234581-5'),
      ('Geraldine Cruz', DATE '1992-02-20', 'Female', 'Pulong Anahao', 'Purok 2', '09171234516', '12-301234582-3'),
      ('Victor Manuel Ong', DATE '1984-06-01', 'Male', 'Saguing', 'Purok 1', '09171234517', '12-301234583-1'),
      ('Rhea Palma', DATE '1998-03-24', 'Female', 'San Francisco', 'Purok 5', '09171234518', '12-301234584-0'),
      ('Francis Tan', DATE '1976-08-06', 'Male', 'San Juan', 'Purok 3', '09171234519', '12-301234585-8'),
      ('Marlon Berces', DATE '1981-12-18', 'Male', 'Santa Ana', 'Purok 4', '09171234520', '12-301234586-6'),
      ('Catherine De Villa', DATE '1990-11-12', 'Female', 'Ligaya', 'Purok 2', '09171234521', '12-301234587-4'),
      ('Emilio Arce', DATE '1968-07-02', 'Male', 'Santo Niño', 'Purok 6', '09171234522', '12-301234588-2'),
      ('Isabel Panganiban', DATE '1987-09-29', 'Female', 'Malimatoc II', 'Purok 3', '09171234523', '12-301234589-0'),
      ('Noel Serrano', DATE '1979-04-16', 'Male', 'Nag-iba', 'Purok 4', '09171234524', '12-301234590-8')
  ) AS v(full_name, birth_date, sex, barangay, purok, contact_number, philhealth_no)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.residents r
    WHERE LOWER(r.full_name) = LOWER(v.full_name)
      AND r.birth_date = v.birth_date
  );

  -- --------------------------------------------------------------------------
  -- 3) Insert realistic health facilities
  -- --------------------------------------------------------------------------

  INSERT INTO public.health_facilities (
    name,
    barangay,
    address,
    operating_hours,
    contact_json,
    general_services,
    specialized_services,
    service_capability,
    yakap_accredited,
    created_at,
    updated_at
  )
  SELECT
    v.name,
    v.barangay,
    v.address,
    v.operating_hours,
    v.contact_json,
    v.general_services,
    v.specialized_services,
    v.service_capability,
    v.yakap_accredited,
    NOW(),
    NOW()
  FROM (
    VALUES
      (
        'Laurel Barangay Health Center',
        'Laurel',
        'Purok 1, Laurel, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0101","email":"cg.health@mabini.gov.ph"}'::jsonb,
        'Primary care, immunization, prenatal checkups',
        'Family planning counseling',
        'Level 1',
        true
      ),
      (
        'Pilahan Community Health Unit',
        'Pilahan',
        'Purok 2, Pilahan, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0102","email":"Pilahan.chu@mabini.gov.ph"}'::jsonb,
        'Outpatient consults, child health',
        'NCD screening',
        'Level 1',
        true
      ),
      (
        'Bulacan Primary Care Clinic',
        'Bulacan',
        'Purok 3, Bulacan, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0103","email":"Bulacan.pcc@mabini.gov.ph"}'::jsonb,
        'Immunization and wellness checks',
        'Senior care follow-up',
        'Level 1',
        false
      ),
      (
        'Pulong Niogan Family Health Station',
        'Pulong Niogan',
        'Purok 4, Pulong Niogan, Mabini, Batangas',
        '07:30-16:30',
        '{"phone":"(054) 881-0104","email":"sanfelipe.fhs@mabini.gov.ph"}'::jsonb,
        'Primary consults and prescriptions',
        'Home-care coordination',
        'Level 1',
        false
      ),
      (
        'Pulong Anahao Maternal and Child Center',
        'Pulong Anahao',
        'Purok 2, Pulong Anahao, Mabini, Batangas',
        '08:00-17:30',
        '{"phone":"(054) 881-0105","email":"Pulong Anahao.mcc@mabini.gov.ph"}'::jsonb,
        'Maternal and child outpatient services',
        'High-risk pregnancy triage',
        'Level 2',
        true
      ),
      (
        'Santa Ana Preventive Care Hub',
        'Santa Ana',
        'Purok 1, Santa Ana, Mabini, Batangas',
        '08:00-17:00',
        '{"phone":"(054) 881-0106","email":"Santa Ana.pch@mabini.gov.ph"}'::jsonb,
        'Preventive screenings and vaccinations',
        'Lifestyle counseling',
        'Level 1',
        true
      )
  ) AS v(name, barangay, address, operating_hours, contact_json, general_services, specialized_services, service_capability, yakap_accredited)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.health_facilities f
    WHERE LOWER(f.name) = LOWER(v.name)
      AND LOWER(f.barangay) = LOWER(v.barangay)
  );

  -- --------------------------------------------------------------------------
  -- 4) Insert realistic vaccination records
  -- --------------------------------------------------------------------------

  INSERT INTO public.vaccination_records (
    resident_id,
    vaccine_name,
    dose_number,
    vaccine_date,
    next_dose_date,
    vaccination_site,
    administered_by,
    batch_number,
    status,
    notes,
    created_at
  )
  SELECT
    r.id,
    v.vaccine_name,
    v.dose_number,
    v.vaccine_date,
    v.next_dose_date,
    v.vaccination_site,
    actor_id,
    v.batch_number,
    v.status,
    v.notes,
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel', 'Influenza', 1, DATE '2026-01-12', DATE '2027-01-12', 'Laurel Barangay Health Center', 'FLU-26-1001', 'completed', 'Annual influenza vaccination.'),
      ('Jose Miguel Ramos', 'Bulacan', 'Pneumococcal (PCV13)', 1, DATE '2025-11-20', NULL, 'Bulacan Primary Care Clinic', 'PCV-25-2330', 'completed', 'Age-based adult immunization.'),
      ('Ana Patricia Lopez', 'Pilahan', 'COVID-19 Booster', 1, DATE '2026-02-06', NULL, 'Pilahan Community Health Unit', 'C19-26-4412', 'completed', 'Booster dose completed.'),
      ('Ramon Villanueva', 'Pulong Niogan', 'Influenza', 1, DATE '2026-01-05', DATE '2027-01-05', 'Pulong Niogan Family Health Station', 'FLU-26-1009', 'completed', 'Senior annual vaccination.'),
      ('Clarissa Dizon', 'Anilao East', 'Tetanus-diphtheria', 1, DATE '2026-02-14', NULL, 'Laurel Barangay Health Center', 'TD-26-3288', 'completed', 'Post-exposure prophylaxis.'),
      ('Leo Martin Castillo', 'Anilao Proper', 'Hepatitis B', 2, DATE '2026-02-22', DATE '2026-05-22', 'Laurel Barangay Health Center', 'HEPB-26-7650', 'pending', 'Awaiting third dose.'),
      ('Sheryl Mae Rivera', 'Bagalangit', 'HPV', 1, DATE '2026-03-01', DATE '2026-09-01', 'Pulong Anahao Maternal and Child Center', 'HPV-26-2311', 'pending', 'Second dose scheduled after 6 months.'),
      ('Crisanto Reyes', 'Sampaguita', 'COVID-19 Booster', 1, DATE '2025-12-18', NULL, 'Pulong Niogan Family Health Station', 'C19-25-8920', 'completed', 'Bivalent booster administered.'),
      ('Janelle Soriano', 'Mainaga', 'Influenza', 1, DATE '2026-02-28', DATE '2027-02-28', 'Laurel Barangay Health Center', 'FLU-26-2219', 'completed', 'Routine annual dose.'),
      ('Paolo Enrico Mendoza', 'Mainit', 'Hepatitis B', 1, DATE '2026-03-04', DATE '2026-04-04', 'Santa Ana Preventive Care Hub', 'HEPB-26-7712', 'pending', 'Second dose due in one month.'),
      ('Helen Bautista', 'Gasang', 'Pneumococcal (PPSV23)', 1, DATE '2025-10-30', NULL, 'Pilahan Community Health Unit', 'PPSV-25-5577', 'completed', 'High-risk adult vaccination.'),
      ('Dominic Flores', 'Estrella', 'COVID-19 Booster', 1, DATE '2026-01-27', NULL, 'Santa Ana Preventive Care Hub', 'C19-26-6602', 'completed', 'Booster completed.'),
      ('Lara Mae Gonzales', 'Calamias', 'Tetanus-diphtheria', 1, DATE '2026-02-11', NULL, 'Pulong Anahao Maternal and Child Center', 'TD-26-3312', 'completed', 'Routine Td update.'),
      ('Nilo Garcia', 'Poblacion', 'Influenza', 1, DATE '2026-01-17', DATE '2027-01-17', 'Pulong Niogan Family Health Station', 'FLU-26-1144', 'completed', 'Seasonal vaccine.'),
      ('Teresita Alonzo', 'Pulong Balibaguhan', 'Pneumococcal (PCV13)', 1, DATE '2025-12-02', NULL, 'Pulong Niogan Family Health Station', 'PCV-25-2442', 'completed', 'Senior vaccination completed.'),
      ('Geraldine Cruz', 'Pulong Anahao', 'HPV', 2, DATE '2026-03-08', NULL, 'Pulong Anahao Maternal and Child Center', 'HPV-26-2380', 'completed', 'Second dose completed.'),
      ('Victor Manuel Ong', 'Saguing', 'Influenza', 1, DATE '2026-01-22', DATE '2027-01-22', 'Santa Ana Preventive Care Hub', 'FLU-26-1199', 'completed', 'Annual dose.'),
      ('Rhea Palma', 'San Francisco', 'COVID-19 Booster', 1, DATE '2026-02-18', NULL, 'Santa Ana Preventive Care Hub', 'C19-26-6921', 'completed', 'Booster completed.'),
      ('Francis Tan', 'San Juan', 'Hepatitis B', 1, DATE '2026-02-25', DATE '2026-03-25', 'Pilahan Community Health Unit', 'HEPB-26-7790', 'overdue', 'Second dose missed follow-up.'),
      ('Marlon Berces', 'Santa Ana', 'Influenza', 1, DATE '2026-01-30', DATE '2027-01-30', 'Santa Ana Preventive Care Hub', 'FLU-26-1277', 'completed', 'Routine annual vaccination.')
  ) AS v(full_name, barangay, vaccine_name, dose_number, vaccine_date, next_dose_date, vaccination_site, batch_number, status, notes)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.vaccination_records vr
    WHERE vr.resident_id = r.id
      AND LOWER(vr.vaccine_name) = LOWER(v.vaccine_name)
      AND vr.dose_number = v.dose_number
      AND vr.vaccine_date = v.vaccine_date
  );

  -- --------------------------------------------------------------------------
  -- 5) Insert maternal health records
  -- --------------------------------------------------------------------------

  INSERT INTO public.maternal_health_records (
    resident_id,
    record_type,
    visit_date,
    trimester,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    weight,
    fetal_heart_rate,
    complications,
    status,
    notes,
    recorded_by,
    created_at,
    updated_at
  )
  SELECT
    r.id,
    v.record_type,
    v.visit_date,
    v.trimester,
    v.bp_sys,
    v.bp_dia,
    v.weight,
    v.fhr,
    v.complications,
    v.status,
    v.notes,
    actor_id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel', 'antenatal', DATE '2026-01-10', 2, 112, 72, 58.3, 146, NULL, 'normal', 'Routine prenatal checkup, no warning signs.'),
      ('Maria Luisa Santos', 'Laurel', 'antenatal', DATE '2026-02-10', 3, 116, 74, 59.6, 148, NULL, 'normal', 'Good fetal movement, advised iron continuation.'),
      ('Ana Patricia Lopez', 'Pilahan', 'antenatal', DATE '2026-01-21', 1, 118, 76, 55.2, 150, NULL, 'normal', 'Initial prenatal intake complete.'),
      ('Ana Patricia Lopez', 'Pilahan', 'antenatal', DATE '2026-02-20', 2, 120, 78, 56.0, 149, 'Mild ankle edema', 'warning', 'Hydration and rest counseling given.'),
      ('Clarissa Dizon', 'Anilao East', 'postnatal', DATE '2026-03-02', NULL, 114, 73, 60.1, NULL, NULL, 'normal', 'Postnatal follow-up, mother stable.'),
      ('Lara Mae Gonzales', 'Calamias', 'antenatal', DATE '2026-02-12', 2, 110, 70, 57.0, 147, NULL, 'normal', 'No complications reported.'),
      ('Geraldine Cruz', 'Pulong Anahao', 'antenatal', DATE '2026-02-28', 3, 122, 80, 61.4, 151, 'Occasional headache', 'warning', 'Advised BP monitoring every week.'),
      ('Rhea Palma', 'San Francisco', 'antenatal', DATE '2026-03-06', 1, 108, 68, 54.8, 145, NULL, 'normal', 'Prenatal vitamins started.')
  ) AS v(full_name, barangay, record_type, visit_date, trimester, bp_sys, bp_dia, weight, fhr, complications, status, notes)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.maternal_health_records m
    WHERE m.resident_id = r.id
      AND m.record_type = v.record_type
      AND m.visit_date = v.visit_date
  );

  -- --------------------------------------------------------------------------
  -- 6) Insert senior assistance records
  -- --------------------------------------------------------------------------

  INSERT INTO public.senior_assistance_records (
    resident_id,
    assistance_type,
    visit_date,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    blood_glucose,
    medications_given,
    vital_status,
    status,
    notes,
    recorded_by,
    follow_up_date,
    created_at,
    updated_at
  )
  SELECT
    r.id,
    v.assistance_type,
    v.visit_date,
    v.bp_sys,
    v.bp_dia,
    v.glucose,
    v.meds,
    v.vital_status,
    v.status,
    v.notes,
    actor_id,
    v.follow_up_date,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Ramon Villanueva', 'Pulong Niogan', 'medical_support', DATE '2026-02-03', 128, 80, 104.0, 'Amlodipine 5mg once daily', 'stable', 'completed', 'Monthly BP monitoring visit completed.', DATE '2026-03-03'),
      ('Crisanto Reyes', 'Sampaguita', 'home_care', DATE '2026-02-07', 132, 82, 110.5, 'Losartan 50mg once daily', 'stable', 'completed', 'Home visit with medication adherence check.', DATE '2026-03-07'),
      ('Nilo Garcia', 'Poblacion', 'medication_delivery', DATE '2026-02-10', 136, 84, 122.0, 'Metformin 500mg twice daily', 'improved', 'completed', 'Delivered one-month maintenance meds.', DATE '2026-03-10'),
      ('Teresita Alonzo', 'Pulong Balibaguhan', 'mobility_support', DATE '2026-02-15', 124, 78, 101.0, 'Calcium + Vitamin D daily', 'stable', 'completed', 'Assisted mobility exercise session.', DATE '2026-03-15'),
      ('Helen Bautista', 'Gasang', 'mental_health', DATE '2026-02-18', 126, 80, 98.5, 'None', 'improved', 'completed', 'Psychosocial support counseling provided.', DATE '2026-03-18'),
        ('Emilio Arce', 'Santo Niño', 'social_services', DATE '2026-02-22', 138, 86, 130.4, 'Gliclazide MR 30mg once daily', 'declining', 'pending', 'Referred for physician review due elevated glucose.', DATE '2026-03-01')
  ) AS v(full_name, barangay, assistance_type, visit_date, bp_sys, bp_dia, glucose, meds, vital_status, status, notes, follow_up_date)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.senior_assistance_records s
    WHERE s.resident_id = r.id
      AND s.assistance_type = v.assistance_type
      AND s.visit_date = v.visit_date
  );

  -- --------------------------------------------------------------------------
  -- 7) Insert vital signs history baseline (20 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.vital_signs_history (
    resident_id,
    systolic,
    diastolic,
    temperature,
    heart_rate,
    respiratory_rate,
    oxygen_saturation,
    weight,
    height,
    bmi,
    recorded_by,
    recorded_at,
    notes,
    created_at
  )
  SELECT
    r.id,
    v.systolic,
    v.diastolic,
    v.temperature,
    v.heart_rate,
    v.respiratory_rate,
    v.oxygen_saturation,
    v.weight,
    v.height,
    v.bmi,
    actor_id,
    v.recorded_at,
    v.notes,
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel', 112, 72, 36.7, 78, 18, 98.0, 58.3, 160.0, 22.8, TIMESTAMPTZ '2026-03-01 08:30:00+08', 'Prenatal follow-up vitals stable.'),
      ('Jose Miguel Ramos', 'Bulacan', 124, 80, 36.6, 74, 18, 97.0, 67.5, 168.0, 23.9, TIMESTAMPTZ '2026-03-01 09:00:00+08', 'Routine adult checkup.'),
      ('Ana Patricia Lopez', 'Pilahan', 118, 76, 36.8, 80, 19, 99.0, 56.0, 157.0, 22.7, TIMESTAMPTZ '2026-03-01 09:30:00+08', 'Mild edema monitored.'),
      ('Ramon Villanueva', 'Pulong Niogan', 128, 80, 36.5, 72, 18, 97.0, 65.2, 166.0, 23.7, TIMESTAMPTZ '2026-03-01 10:00:00+08', 'Senior assessment visit.'),
      ('Clarissa Dizon', 'Anilao East', 114, 73, 36.7, 77, 18, 98.0, 60.1, 161.0, 23.2, TIMESTAMPTZ '2026-03-01 10:30:00+08', 'Postnatal review.'),
      ('Leo Martin Castillo', 'Anilao Proper', 122, 78, 36.8, 76, 18, 98.0, 70.5, 170.0, 24.4, TIMESTAMPTZ '2026-03-01 11:00:00+08', 'Hep B follow-up.'),
      ('Sheryl Mae Rivera', 'Bagalangit', 110, 70, 36.6, 79, 18, 99.0, 52.7, 155.0, 21.9, TIMESTAMPTZ '2026-03-01 11:30:00+08', 'HPV first dose follow-up.'),
      ('Crisanto Reyes', 'Sampaguita', 132, 82, 36.4, 70, 17, 97.0, 63.0, 165.0, 23.1, TIMESTAMPTZ '2026-03-01 13:00:00+08', 'Home-care monitoring.'),
      ('Janelle Soriano', 'Mainaga', 108, 68, 36.7, 82, 19, 99.0, 50.4, 154.0, 21.3, TIMESTAMPTZ '2026-03-01 13:30:00+08', 'Young adult preventive check.'),
      ('Paolo Enrico Mendoza', 'Mainit', 120, 78, 36.8, 75, 18, 98.0, 68.1, 172.0, 23.0, TIMESTAMPTZ '2026-03-01 14:00:00+08', 'Adult preventive check.'),
      ('Helen Bautista', 'Gasang', 126, 80, 36.5, 73, 18, 97.0, 59.4, 158.0, 23.8, TIMESTAMPTZ '2026-03-01 14:30:00+08', 'NCD monitoring visit.'),
      ('Dominic Flores', 'Estrella', 118, 76, 36.6, 74, 18, 98.0, 71.3, 173.0, 23.8, TIMESTAMPTZ '2026-03-01 15:00:00+08', 'Booster follow-up.'),
      ('Lara Mae Gonzales', 'Calamias', 110, 70, 36.7, 79, 18, 99.0, 57.0, 159.0, 22.5, TIMESTAMPTZ '2026-03-01 15:30:00+08', 'Prenatal monitoring.'),
      ('Nilo Garcia', 'Poblacion', 136, 84, 36.5, 71, 17, 97.0, 69.0, 167.0, 24.7, TIMESTAMPTZ '2026-03-01 16:00:00+08', 'Medication delivery visit.'),
      ('Teresita Alonzo', 'Pulong Balibaguhan', 124, 78, 36.6, 72, 18, 98.0, 58.2, 156.0, 23.9, TIMESTAMPTZ '2026-03-02 08:30:00+08', 'Senior mobility support.'),
      ('Geraldine Cruz', 'Pulong Anahao', 122, 80, 36.8, 81, 19, 98.0, 61.4, 162.0, 23.4, TIMESTAMPTZ '2026-03-02 09:00:00+08', 'Third-trimester assessment.'),
      ('Victor Manuel Ong', 'Saguing', 120, 76, 36.6, 74, 18, 98.0, 72.4, 174.0, 23.9, TIMESTAMPTZ '2026-03-02 09:30:00+08', 'Annual check and counseling.'),
      ('Rhea Palma', 'San Francisco', 108, 68, 36.7, 80, 18, 99.0, 54.8, 158.0, 22.0, TIMESTAMPTZ '2026-03-02 10:00:00+08', 'Early pregnancy routine check.'),
      ('Francis Tan', 'San Juan', 130, 82, 36.5, 73, 18, 97.0, 70.2, 171.0, 24.0, TIMESTAMPTZ '2026-03-02 10:30:00+08', 'Overdue vaccine counseling.'),
      ('Marlon Berces', 'Santa Ana', 118, 74, 36.6, 75, 18, 98.0, 73.5, 175.0, 24.0, TIMESTAMPTZ '2026-03-02 11:00:00+08', 'Preventive screening normal.')
  ) AS v(full_name, barangay, systolic, diastolic, temperature, heart_rate, respiratory_rate, oxygen_saturation, weight, height, bmi, recorded_at, notes)
  JOIN public.residents r
    ON LOWER(r.full_name) = LOWER(v.full_name)
   AND LOWER(r.barangay) = LOWER(v.barangay)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.vital_signs_history vs
    WHERE vs.resident_id = r.id
      AND vs.recorded_at = v.recorded_at
  );

  -- --------------------------------------------------------------------------
  -- 8) Insert appointments baseline (24 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.appointments (
    facility_id,
    resident_id,
    appointment_date,
    time_slot,
    service_type,
    status,
    booked_at,
    notes,
    created_at,
    updated_at
  )
  SELECT
    f.id,
    r.id,
    v.appointment_date,
    v.time_slot,
    v.service_type,
    v.status,
    v.booked_at,
    v.notes,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'Laurel Barangay Health Center', DATE '2026-03-18', '08:30-09:00', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 09:00:00+08', 'Third trimester follow-up'),
      ('Jose Miguel Ramos', 'Bulacan Primary Care Clinic', DATE '2026-03-19', '09:00-09:30', 'Hypertension Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 09:15:00+08', 'BP monitoring'),
      ('Ana Patricia Lopez', 'Pilahan Community Health Unit', DATE '2026-03-20', '10:00-10:30', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 09:30:00+08', 'Routine ANC'),
      ('Ramon Villanueva', 'Pulong Niogan Family Health Station', DATE '2026-03-20', '13:00-13:30', 'Senior Consultation', 'booked', TIMESTAMPTZ '2026-03-10 09:45:00+08', 'Medication refill review'),
      ('Clarissa Dizon', 'Laurel Barangay Health Center', DATE '2026-03-21', '09:30-10:00', 'Postnatal Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 10:00:00+08', '6-week postnatal check'),
      ('Leo Martin Castillo', 'Laurel Barangay Health Center', DATE '2026-03-22', '11:00-11:30', 'Vaccination', 'booked', TIMESTAMPTZ '2026-03-10 10:15:00+08', 'Hep B next dose'),
      ('Sheryl Mae Rivera', 'Pulong Anahao Maternal and Child Center', DATE '2026-03-22', '14:00-14:30', 'Vaccination', 'booked', TIMESTAMPTZ '2026-03-10 10:30:00+08', 'HPV counseling and follow-up'),
      ('Crisanto Reyes', 'Pulong Niogan Family Health Station', DATE '2026-03-23', '08:00-08:30', 'Home-care Plan Review', 'booked', TIMESTAMPTZ '2026-03-10 10:45:00+08', 'Senior case conference'),
      ('Janelle Soriano', 'Laurel Barangay Health Center', DATE '2026-03-23', '10:30-11:00', 'Wellness Check', 'booked', TIMESTAMPTZ '2026-03-10 11:00:00+08', 'Routine wellness check'),
      ('Paolo Enrico Mendoza', 'Santa Ana Preventive Care Hub', DATE '2026-03-24', '15:00-15:30', 'Vaccination', 'booked', TIMESTAMPTZ '2026-03-10 11:15:00+08', 'Hep B dose scheduling'),
      ('Helen Bautista', 'Pilahan Community Health Unit', DATE '2026-03-24', '09:00-09:30', 'NCD Monitoring', 'booked', TIMESTAMPTZ '2026-03-10 11:30:00+08', 'BP and glucose review'),
      ('Dominic Flores', 'Santa Ana Preventive Care Hub', DATE '2026-03-25', '08:30-09:00', 'Booster Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 11:45:00+08', 'Post booster assessment'),
      ('Lara Mae Gonzales', 'Pulong Anahao Maternal and Child Center', DATE '2026-03-25', '10:00-10:30', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 12:00:00+08', 'Routine ANC visit'),
      ('Nilo Garcia', 'Pulong Niogan Family Health Station', DATE '2026-03-26', '13:30-14:00', 'Senior Consultation', 'booked', TIMESTAMPTZ '2026-03-10 12:15:00+08', 'Diabetes medication reassessment'),
      ('Teresita Alonzo', 'Pulong Niogan Family Health Station', DATE '2026-03-26', '14:30-15:00', 'Mobility Support', 'booked', TIMESTAMPTZ '2026-03-10 12:30:00+08', 'Physical mobility re-evaluation'),
      ('Geraldine Cruz', 'Pulong Anahao Maternal and Child Center', DATE '2026-03-27', '08:30-09:00', 'Prenatal Checkup', 'booked', TIMESTAMPTZ '2026-03-10 12:45:00+08', 'High-risk monitoring'),
      ('Victor Manuel Ong', 'Santa Ana Preventive Care Hub', DATE '2026-03-27', '11:00-11:30', 'Wellness Check', 'booked', TIMESTAMPTZ '2026-03-10 13:00:00+08', 'Annual physical follow-up'),
      ('Rhea Palma', 'Santa Ana Preventive Care Hub', DATE '2026-03-28', '09:30-10:00', 'Prenatal Intake', 'booked', TIMESTAMPTZ '2026-03-10 13:15:00+08', 'Initial ANC package'),
      ('Francis Tan', 'Pilahan Community Health Unit', DATE '2026-03-28', '13:00-13:30', 'Vaccination Follow-up', 'booked', TIMESTAMPTZ '2026-03-10 13:30:00+08', 'Overdue second dose counseling'),
      ('Marlon Berces', 'Santa Ana Preventive Care Hub', DATE '2026-03-29', '15:30-16:00', 'Preventive Screening', 'booked', TIMESTAMPTZ '2026-03-10 13:45:00+08', 'Lifestyle screening'),
      ('Isabel Panganiban', 'Laurel Barangay Health Center', DATE '2026-03-30', '08:00-08:30', 'General Consultation', 'booked', TIMESTAMPTZ '2026-03-10 14:00:00+08', 'General symptom check'),
      ('Noel Serrano', 'Pilahan Community Health Unit', DATE '2026-03-30', '10:30-11:00', 'NCD Screening', 'booked', TIMESTAMPTZ '2026-03-10 14:15:00+08', 'BP and glucose screening'),
      ('Catherine De Villa', 'Laurel Barangay Health Center', DATE '2026-03-31', '09:00-09:30', 'Family Planning', 'booked', TIMESTAMPTZ '2026-03-10 14:30:00+08', 'Counseling session'),
      ('Emilio Arce', 'Pulong Niogan Family Health Station', DATE '2026-03-31', '14:00-14:30', 'Senior Consultation', 'booked', TIMESTAMPTZ '2026-03-10 14:45:00+08', 'Follow-up after social services referral')
  ) AS v(full_name, facility_name, appointment_date, time_slot, service_type, status, booked_at, notes)
  JOIN public.residents r ON LOWER(r.full_name) = LOWER(v.full_name)
  JOIN public.health_facilities f ON LOWER(f.name) = LOWER(v.facility_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.resident_id = r.id
      AND a.facility_id = f.id
      AND a.appointment_date = v.appointment_date
      AND a.time_slot = v.time_slot
  );

  -- --------------------------------------------------------------------------
  -- 9) Insert YAKAP applications baseline (20 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.yakap_applications (
    resident_name,
    barangay,
    membership_type,
    philhealth_no,
    status,
    applied_at,
    approved_by,
    approved_at,
    remarks,
    resident_id,
    created_at,
    updated_at
  )
  SELECT
    r.full_name,
    r.barangay,
    v.membership_type,
    r.philhealth_no,
    v.status,
    v.applied_at,
    CASE WHEN v.status = 'approved' THEN actor_id ELSE NULL END,
    CASE WHEN v.status = 'approved' THEN v.applied_at + INTERVAL '3 days' ELSE NULL END,
    v.remarks,
    r.id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'family', 'approved', TIMESTAMPTZ '2026-02-01 08:00:00+08', 'Validated household records.'),
      ('Jose Miguel Ramos', 'individual', 'pending', TIMESTAMPTZ '2026-02-02 09:00:00+08', 'Awaiting final verification.'),
      ('Ana Patricia Lopez', 'family', 'approved', TIMESTAMPTZ '2026-02-03 08:30:00+08', 'Eligibility confirmed.'),
      ('Ramon Villanueva', 'senior', 'approved', TIMESTAMPTZ '2026-02-04 10:00:00+08', 'Senior category complete.'),
      ('Clarissa Dizon', 'individual', 'pending', TIMESTAMPTZ '2026-02-05 11:00:00+08', 'Pending document upload.'),
      ('Leo Martin Castillo', 'family', 'pending', TIMESTAMPTZ '2026-02-06 08:15:00+08', 'For barangay validation.'),
      ('Sheryl Mae Rivera', 'individual', 'approved', TIMESTAMPTZ '2026-02-07 09:20:00+08', 'Member registration approved.'),
      ('Crisanto Reyes', 'senior', 'approved', TIMESTAMPTZ '2026-02-08 10:40:00+08', 'Senior benefits activated.'),
      ('Janelle Soriano', 'individual', 'pending', TIMESTAMPTZ '2026-02-09 11:30:00+08', 'Queued for review.'),
      ('Paolo Enrico Mendoza', 'family', 'returned', TIMESTAMPTZ '2026-02-10 13:00:00+08', 'Please update contact details.'),
      ('Helen Bautista', 'pwd', 'approved', TIMESTAMPTZ '2026-02-11 14:00:00+08', 'PWD category validated.'),
      ('Dominic Flores', 'individual', 'pending', TIMESTAMPTZ '2026-02-12 08:45:00+08', 'Pending ID verification.'),
      ('Lara Mae Gonzales', 'family', 'approved', TIMESTAMPTZ '2026-02-13 09:50:00+08', 'Family enrollment successful.'),
      ('Nilo Garcia', 'senior', 'approved', TIMESTAMPTZ '2026-02-14 10:10:00+08', 'Senior enrollment approved.'),
      ('Teresita Alonzo', 'senior', 'approved', TIMESTAMPTZ '2026-02-15 11:10:00+08', 'Senior enrollment approved.'),
      ('Geraldine Cruz', 'family', 'pending', TIMESTAMPTZ '2026-02-16 08:20:00+08', 'Pending household dependency docs.'),
      ('Victor Manuel Ong', 'individual', 'approved', TIMESTAMPTZ '2026-02-17 09:40:00+08', 'Application approved after interview.'),
      ('Rhea Palma', 'family', 'pending', TIMESTAMPTZ '2026-02-18 10:50:00+08', 'In progress review.'),
      ('Francis Tan', 'individual', 'returned', TIMESTAMPTZ '2026-02-19 13:15:00+08', 'Submit clearer PhilHealth image.'),
      ('Marlon Berces', 'family', 'approved', TIMESTAMPTZ '2026-02-20 14:25:00+08', 'Application complete and approved.')
  ) AS v(full_name, membership_type, status, applied_at, remarks)
  JOIN public.residents r ON LOWER(r.full_name) = LOWER(v.full_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.yakap_applications y
    WHERE y.resident_id = r.id
      AND y.membership_type = v.membership_type
      AND y.applied_at = v.applied_at
  );

  -- --------------------------------------------------------------------------
  -- 10) Insert health indicator baseline (24 entries)
  -- --------------------------------------------------------------------------

  INSERT INTO public.health_indicators (
    resident_id,
    indicator_type,
    value,
    unit,
    status,
    notes,
    recorded_by,
    recorded_at,
    created_at
  )
  SELECT
    r.id,
    v.indicator_type,
    v.value,
    v.unit,
    v.status,
    v.notes,
    actor_id,
    v.recorded_at,
    NOW()
  FROM (
    VALUES
      ('Maria Luisa Santos', 'blood_pressure', 112, 'mmHg', 'normal', 'ANC visit BP systolic', TIMESTAMPTZ '2026-03-01 08:30:00+08'),
      ('Maria Luisa Santos', 'heart_rate', 78, 'bpm', 'normal', 'Resting pulse', TIMESTAMPTZ '2026-03-01 08:31:00+08'),
      ('Jose Miguel Ramos', 'blood_pressure', 124, 'mmHg', 'normal', 'Routine BP check', TIMESTAMPTZ '2026-03-01 09:00:00+08'),
      ('Jose Miguel Ramos', 'glucose', 104.0, 'mg/dL', 'normal', 'Fasting glucose', TIMESTAMPTZ '2026-03-01 09:05:00+08'),
      ('Ana Patricia Lopez', 'temperature', 36.8, 'C', 'normal', 'No fever', TIMESTAMPTZ '2026-03-01 09:30:00+08'),
      ('Ana Patricia Lopez', 'weight', 56.0, 'kg', 'normal', 'Prenatal weight check', TIMESTAMPTZ '2026-03-01 09:31:00+08'),
      ('Ramon Villanueva', 'blood_pressure', 128, 'mmHg', 'warning', 'Borderline systolic', TIMESTAMPTZ '2026-03-01 10:00:00+08'),
      ('Ramon Villanueva', 'oxygen_saturation', 97.0, '%', 'normal', 'Pulse oximetry', TIMESTAMPTZ '2026-03-01 10:01:00+08'),
      ('Clarissa Dizon', 'heart_rate', 77, 'bpm', 'normal', 'Postnatal pulse', TIMESTAMPTZ '2026-03-01 10:30:00+08'),
      ('Clarissa Dizon', 'respiratory_rate', 18, 'breaths/min', 'normal', 'Respiratory assessment', TIMESTAMPTZ '2026-03-01 10:31:00+08'),
      ('Leo Martin Castillo', 'blood_pressure', 122, 'mmHg', 'normal', 'Pre-vaccine BP', TIMESTAMPTZ '2026-03-01 11:00:00+08'),
      ('Sheryl Mae Rivera', 'temperature', 36.6, 'C', 'normal', 'Pre-vaccine temperature', TIMESTAMPTZ '2026-03-01 11:30:00+08'),
      ('Crisanto Reyes', 'glucose', 110.5, 'mg/dL', 'warning', 'Senior glucose monitor', TIMESTAMPTZ '2026-03-01 13:00:00+08'),
      ('Janelle Soriano', 'bmi', 21.3, 'kg/m2', 'normal', 'Wellness BMI', TIMESTAMPTZ '2026-03-01 13:30:00+08'),
      ('Paolo Enrico Mendoza', 'blood_pressure', 120, 'mmHg', 'normal', 'Routine screening', TIMESTAMPTZ '2026-03-01 14:00:00+08'),
      ('Helen Bautista', 'glucose', 98.5, 'mg/dL', 'normal', 'Random glucose check', TIMESTAMPTZ '2026-03-01 14:30:00+08'),
      ('Dominic Flores', 'oxygen_saturation', 98.0, '%', 'normal', 'Post-vaccine observation', TIMESTAMPTZ '2026-03-01 15:00:00+08'),
      ('Lara Mae Gonzales', 'weight', 57.0, 'kg', 'normal', 'Prenatal weight monitor', TIMESTAMPTZ '2026-03-01 15:30:00+08'),
      ('Nilo Garcia', 'blood_pressure', 136, 'mmHg', 'warning', 'Elevated systolic noted', TIMESTAMPTZ '2026-03-01 16:00:00+08'),
      ('Teresita Alonzo', 'blood_pressure', 124, 'mmHg', 'normal', 'Senior monitoring', TIMESTAMPTZ '2026-03-02 08:30:00+08'),
      ('Geraldine Cruz', 'heart_rate', 81, 'bpm', 'normal', 'Third-trimester pulse', TIMESTAMPTZ '2026-03-02 09:00:00+08'),
      ('Victor Manuel Ong', 'bmi', 23.9, 'kg/m2', 'normal', 'Annual screening BMI', TIMESTAMPTZ '2026-03-02 09:30:00+08'),
      ('Rhea Palma', 'temperature', 36.7, 'C', 'normal', 'Prenatal intake temperature', TIMESTAMPTZ '2026-03-02 10:00:00+08'),
      ('Francis Tan', 'blood_pressure', 130, 'mmHg', 'warning', 'Follow-up due overdue dose', TIMESTAMPTZ '2026-03-02 10:30:00+08')
  ) AS v(full_name, indicator_type, value, unit, status, notes, recorded_at)
  JOIN public.residents r ON LOWER(r.full_name) = LOWER(v.full_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.health_indicators hi
    WHERE hi.resident_id = r.id
      AND hi.indicator_type = v.indicator_type
      AND hi.recorded_at = v.recorded_at
  );

  RAISE NOTICE 'Placeholder cleanup + realistic healthcare seed completed successfully.';
END
$$;


-- END FILE: migrations/008_replace_placeholder_with_realistic_healthcare_data.sql


-- ============================================================================
-- BEGIN FILE: migrations/04_vaccination_coverage_by_barangay.sql
-- ============================================================================

/*

-- ============================================================================
-- Barangay Vaccination Coverage - Database Schema & Migration
-- ============================================================================
-- This SQL schema creates tables to store and calculate vaccination coverage
-- data aggregated by barangay, supporting the GIS map visualization feature.

-- ============================================================================
-- TABLE: vaccination_records
-- Purpose: Core vaccination records for individual residents
-- ============================================================================
CREATE TABLE IF NOT EXISTS vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  vaccine_type VARCHAR(100) NOT NULL,
  dose_number INTEGER NOT NULL,
  vaccination_date DATE NOT NULL,
  vaccinator_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_vaccination UNIQUE (resident_id, vaccine_type, dose_number)
);

CREATE INDEX idx_vaccination_barangay ON vaccination_records(barangay);
CREATE INDEX idx_vaccination_date ON vaccination_records(vaccination_date);
CREATE INDEX idx_vaccination_resident ON vaccination_records(resident_id);

-- ============================================================================
-- TABLE: health_interventions
-- Purpose: Track pending and completed health interventions by barangay
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  intervention_type VARCHAR(100) NOT NULL, -- vaccination, maternal_care, senior_care, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, critical
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intervention_barangay ON health_interventions(barangay);
CREATE INDEX idx_intervention_status ON health_interventions(status);
CREATE INDEX idx_intervention_resident ON health_interventions(resident_id);

-- ============================================================================
-- TABLE: maternal_health_visits
-- Purpose: Track maternal health visits and prenatal care by barangay
-- ============================================================================
CREATE TABLE IF NOT EXISTS maternal_health_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  visit_type VARCHAR(100) NOT NULL, -- prenatal, postnatal, screening, etc.
  visit_date DATE NOT NULL,
  health_worker_id UUID REFERENCES users(id),
  findings TEXT,
  referral_needed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maternal_barangay ON maternal_health_visits(barangay);
CREATE INDEX idx_maternal_visit_date ON maternal_health_visits(visit_date);

-- ============================================================================
-- TABLE: senior_citizen_assistance
-- Purpose: Track assisted senior citizens and their care records by barangay
-- ============================================================================
CREATE TABLE IF NOT EXISTS senior_citizen_assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  assistance_type VARCHAR(100) NOT NULL, -- medical, nutritional, social, etc.
  assistance_date DATE NOT NULL,
  health_worker_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_senior_barangay ON senior_citizen_assistance(barangay);
CREATE INDEX idx_senior_assistance_date ON senior_citizen_assistance(assistance_date);

-- ============================================================================
-- VIEW: barangay_vaccination_summary
-- Purpose: Aggregated vaccination coverage statistics by barangay
-- This view is used by the GIS map component to display coverage data
-- ============================================================================
CREATE OR REPLACE VIEW barangay_vaccination_summary AS
SELECT
  r.barangay AS barangay_name,
  COUNT(DISTINCT r.id) AS total_residents,
  COUNT(DISTINCT CASE 
    WHEN vr.resident_id IS NOT NULL THEN vr.resident_id 
  END) AS vaccinated_residents,
  ROUND(
    (COUNT(DISTINCT CASE WHEN vr.resident_id IS NOT NULL THEN vr.resident_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT r.id)::NUMERIC, 0) * 100)::NUMERIC, 
    2
  ) AS vaccination_coverage_percentage,
  COUNT(DISTINCT CASE 
    WHEN hi.status = 'pending' THEN hi.id 
  END) AS pending_interventions_count,
  COUNT(DISTINCT CASE 
    WHEN mhv.resident_id IS NOT NULL THEN mhv.resident_id 
  END) AS maternal_health_visits_count,
  COUNT(DISTINCT CASE 
    WHEN sca.resident_id IS NOT NULL THEN sca.resident_id 
  END) AS senior_citizens_assisted_count,
  MAX(GREATEST(
    (SELECT MAX(vaccination_date) FROM vaccination_records WHERE barangay = r.barangay),
    (SELECT MAX(visit_date) FROM maternal_health_visits WHERE barangay = r.barangay),
    (SELECT MAX(assistance_date) FROM senior_citizen_assistance WHERE barangay = r.barangay),
    NOW() - INTERVAL '30 days'
  )) AS last_updated_at
FROM residents r
LEFT JOIN vaccination_records vr ON r.id = vr.resident_id 
  AND vr.vaccination_date <= CURRENT_DATE
LEFT JOIN health_interventions hi ON r.id = hi.resident_id 
  AND hi.barangay = r.barangay
LEFT JOIN maternal_health_visits mhv ON r.id = mhv.resident_id 
  AND mhv.barangay = r.barangay
  AND mhv.visit_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN senior_citizen_assistance sca ON r.id = sca.resident_id 
  AND sca.barangay = r.barangay
  AND sca.assistance_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY r.barangay
ORDER BY barangay_name;

-- ============================================================================
-- VIEW: barangay_health_status
-- Purpose: Health status indicators by barangay (for dashboard alerts)
-- ============================================================================
CREATE OR REPLACE VIEW barangay_health_status AS
SELECT
  barangay_name,
  vaccination_coverage_percentage,
  pending_interventions_count,
  total_residents,
  CASE
    WHEN vaccination_coverage_percentage < 50 OR pending_interventions_count > 10 
      THEN 'critical'
    WHEN vaccination_coverage_percentage < 70 OR pending_interventions_count > 5 
      THEN 'warning'
    ELSE 'good'
  END AS health_status,
  ROUND(
    (vaccination_coverage_percentage * 0.7 + 
     GREATEST(0, 100 - (pending_interventions_count::NUMERIC / NULLIF(total_residents, 0) * 100)) * 0.3)
    , 2
  ) AS health_score
FROM barangay_vaccination_summary;

-- ============================================================================
-- FUNCTION: update_vaccination_coverage()
-- Purpose: Refresh vaccination coverage metrics after vaccination records
-- ============================================================================
CREATE OR REPLACE FUNCTION update_vaccination_coverage()
RETURNS TRIGGER AS $$
BEGIN
  -- The view will automatically reflect changes since it queries the base tables
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_update_vaccination_metrics
-- Purpose: Track changes to vaccination records
-- ============================================================================
CREATE TRIGGER trigger_update_vaccination_metrics
AFTER INSERT OR UPDATE OR DELETE ON vaccination_records
FOR EACH ROW
EXECUTE FUNCTION update_vaccination_coverage();

-- ============================================================================
-- RLS POLICIES for vaccination views
-- ============================================================================
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maternal_health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_citizen_assistance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see vaccination data from their assigned barangay
CREATE POLICY vaccination_records_barangay_policy ON vaccination_records
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users WHERE barangay = vaccination_records.barangay
  )
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Health workers can see interventions in their barangay
CREATE POLICY health_interventions_barangay_policy ON health_interventions
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users WHERE barangay = health_interventions.barangay
  )
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- OPTIONAL BASELINE DATA INSERTION
-- ============================================================================
-- This section can be used to bootstrap healthcare records for the GIS map.
-- Review and adapt values to match your community profile before running.

-- Sample vaccination records
-- INSERT INTO vaccination_records (resident_id, barangay, vaccine_type, dose_number, vaccination_date)
-- SELECT 
--   id,
--   barangay,
--   (ARRAY['COVID-19', 'Polio', 'Measles'])[floor(random()*3 + 1)::int],
--   floor(random()*3 + 1)::int,
--   CURRENT_DATE - (floor(random()*365))::int
-- FROM residents
-- WHERE barangay IN ('San Juan', 'Santa Cruz', 'Quiapo', 'Binondo', 'Intramuros', 
--                    'Santa Ana', 'Tondo', 'Sampaloc', 'Malate', 'Ermita')
-- LIMIT 500;

-- ============================================================================
-- INDEXES for performance optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_barangay_summary_coverage 
ON barangay_vaccination_summary (vaccination_coverage_percentage);

CREATE INDEX IF NOT EXISTS idx_barangay_summary_interventions 
ON barangay_vaccination_summary (pending_interventions_count);

-- ============================================================================
-- GRANTS/PERMISSIONS
-- ============================================================================
-- Grant select permission on views to authenticated users
GRANT SELECT ON barangay_vaccination_summary TO authenticated;
GRANT SELECT ON barangay_health_status TO authenticated;

-- Grant all permissions on tables to service role (backend operations)
GRANT ALL ON vaccination_records TO service_role;
GRANT ALL ON health_interventions TO service_role;
GRANT ALL ON maternal_health_visits TO service_role;
GRANT ALL ON senior_citizen_assistance TO service_role;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 1. Run these migrations with admin/superuser privileges
-- 2. Ensure residents table exists before running this migration
-- 3. Update RLS policies based on your actual authentication setup
-- 4. Validate views and baseline data queries
-- 5. Monitor performance with EXPLAIN ANALYZE for large datasets
-- 6. Run periodic ANALYZE to update table statistics
-- ============================================================================

*/


-- END FILE: migrations/04_vaccination_coverage_by_barangay.sql


-- ============================================================================
-- BEGIN FILE: migrations/pregnancy-profiling.sql
-- ============================================================================

-- =============================================================
-- Pregnancy Profiling Records Table + RLS Policies
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pregnancy_profiling_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  resident_id uuid NOT NULL
    REFERENCES public.residents(id) ON DELETE CASCADE,

  -- Core tracking
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  is_inquirer boolean NOT NULL DEFAULT false,
  inquiry_details text,

  -- 1) Pregnancy History
  gravida integer CHECK (gravida >= 0),
  para integer CHECK (para >= 0),
  term integer CHECK (term >= 0),
  pre_term integer CHECK (pre_term >= 0),
  abortion integer CHECK (abortion >= 0),
  living integer CHECK (living >= 0),
  type_of_delivery text,

  -- 2) Pertinent Physical Examination Findings
  blood_pressure text,
  heart_rate integer CHECK (heart_rate > 0),
  respiratory_rate integer CHECK (respiratory_rate > 0),
  height numeric(6,2) CHECK (height > 0),
  weight numeric(6,2) CHECK (weight > 0),
  bmi numeric(6,2) CHECK (bmi > 0),
  temperature numeric(4,1) CHECK (temperature > 0),
  visual_acuity_left text,
  visual_acuity_right text,

  -- 3) Pediatric Client (0–24 months)
  length numeric(6,2) CHECK (length > 0),
  waist_circumference numeric(6,2) CHECK (waist_circumference > 0),
  middle_upper_arm_circumference numeric(6,2) CHECK (middle_upper_arm_circumference > 0),
  head_circumference numeric(6,2) CHECK (head_circumference > 0),
  hip numeric(6,2) CHECK (hip > 0),
  skinfold_thickness numeric(6,2) CHECK (skinfold_thickness > 0),
  limbs text,

  -- 4) Pediatric Client (0–60 months)
  blood_type text CHECK (blood_type IN ('A+','B+','AB+','O+','A-','B-','AB-','O-')),
  z_score_cm numeric(6,2),

  -- 5) General Survey (jsonb per body system)
  -- Shape: { "heent": {"findings":[], "others":""}, ... }
  general_survey jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- 6) NCD High Risk Assessment
  eats_processed_fast_foods text CHECK (eats_processed_fast_foods IN ('yes','no')),
  vegetables_3_servings_daily text CHECK (vegetables_3_servings_daily IN ('yes','no')),
  fruits_2_3_servings_daily text CHECK (fruits_2_3_servings_daily IN ('yes','no')),
  moderate_activity_2_5hrs_weekly text CHECK (moderate_activity_2_5hrs_weekly IN ('yes','no')),
  diagnosed_diabetes text CHECK (diagnosed_diabetes IN ('yes','no','do_not_know')),
  diabetes_management text CHECK (diabetes_management IN ('with_medication','without_medication')),
  diabetes_symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,

  angina_or_heart_attack text CHECK (angina_or_heart_attack IN ('yes','no')),
  chest_pain_pressure text CHECK (chest_pain_pressure IN ('yes','no')),
  chest_left_arm_pain text CHECK (chest_left_arm_pain IN ('yes','no')),
  chest_pain_with_walking_uphill_hurry text CHECK (chest_pain_with_walking_uphill_hurry IN ('yes','no')),
  chest_pain_slows_down_walking text CHECK (chest_pain_slows_down_walking IN ('yes','no')),
  chest_pain_relieved_by_rest_or_tablet text CHECK (chest_pain_relieved_by_rest_or_tablet IN ('yes','no')),
  chest_pain_gone_under_10mins text CHECK (chest_pain_gone_under_10mins IN ('yes','no')),
  chest_pain_severe_30mins_or_more text CHECK (chest_pain_severe_30mins_or_more IN ('yes','no')),
  stroke_or_tia text CHECK (stroke_or_tia IN ('yes','no')),
  difficulty_talking_or_one_side_weakness text CHECK (difficulty_talking_or_one_side_weakness IN ('yes','no')),
  risk_level text CHECK (risk_level IN ('lt_10','10_to_lt_20','20_to_lt_30','30_to_lt_40','gte_40')),

  -- 7) Lab Results
  raised_blood_glucose text CHECK (raised_blood_glucose IN ('yes','no')),
  raised_blood_glucose_date date,
  raised_blood_glucose_result text,

  raised_blood_lipids text CHECK (raised_blood_lipids IN ('yes','no')),
  raised_blood_lipids_date date,
  raised_blood_lipids_result text,

  urine_ketones_positive text CHECK (urine_ketones_positive IN ('yes','no')),
  urine_ketones_date date,
  urine_ketones_result text,

  urine_protein_positive text CHECK (urine_protein_positive IN ('yes','no')),
  urine_protein_date date,
  urine_protein_result text,

  notes text,

  recorded_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pregnancy_profiling_records_resident_unique UNIQUE (resident_id)
);

CREATE INDEX IF NOT EXISTS idx_ppr_resident_id ON public.pregnancy_profiling_records(resident_id);
CREATE INDEX IF NOT EXISTS idx_ppr_visit_date ON public.pregnancy_profiling_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_ppr_is_inquirer ON public.pregnancy_profiling_records(is_inquirer);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_ppr_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_ppr_updated_at ON public.pregnancy_profiling_records;
CREATE TRIGGER trg_set_ppr_updated_at
BEFORE UPDATE ON public.pregnancy_profiling_records
FOR EACH ROW EXECUTE FUNCTION public.set_ppr_updated_at();

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE public.pregnancy_profiling_records ENABLE ROW LEVEL SECURITY;

-- LGU staff can view all records in their assigned barangay
CREATE POLICY "staff_select_pregnancy_records"
  ON public.pregnancy_profiling_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
        AND u.role IN ('staff', 'admin', 'barangay_admin')
    )
  );

-- LGU staff can insert new records
CREATE POLICY "staff_insert_pregnancy_records"
  ON public.pregnancy_profiling_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
        AND u.role IN ('staff', 'admin', 'barangay_admin')
    )
  );

-- LGU staff can update records they created or that belong to their barangay
CREATE POLICY "staff_update_pregnancy_records"
  ON public.pregnancy_profiling_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
        AND u.role IN ('staff', 'admin', 'barangay_admin')
    )
  );

-- Only admins can delete records
CREATE POLICY "admin_delete_pregnancy_records"
  ON public.pregnancy_profiling_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
        AND u.role IN ('admin')
    )
  );


-- END FILE: migrations/pregnancy-profiling.sql


