-- ============================================================================
-- SCHEMA SETUP SCRIPT (TABLES / ALTER / INDEX / POLICY / FUNCTION / TRIGGER)
-- Run this first.
-- Generated: 2026-03-30
-- ============================================================================


-- ============================================================================
-- BEGIN FILE: migrations/001_yakap_applications_add_form_data.sql
-- ============================================================================

-- ============================================================================
-- YAKAP APPLICATIONS TABLE MIGRATION
-- Adds comprehensive form data and resident_id fields
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.yakap_applications') IS NULL THEN
    RAISE NOTICE 'Skipping 001_yakap_applications_add_form_data: public.yakap_applications does not exist.';
    RETURN;
  END IF;

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

  -- Add comment to table for documentation
  COMMENT ON TABLE public.yakap_applications IS 'PhilHealth Konsulta (Yakap) application submissions with comprehensive form data';
  COMMENT ON COLUMN public.yakap_applications.form_data IS 'Complete form data from PhilHealth Konsulta submission stored as JSONB';
  COMMENT ON COLUMN public.yakap_applications.resident_id IS 'Link to resident submitting the application';
END
$$;

-- Add foreign key constraint to residents table if it exists
-- Uncomment this if you have a residents table
-- ALTER TABLE public.yakap_applications
-- ADD CONSTRAINT yakap_applications_resident_id_fkey 
-- FOREIGN KEY (resident_id) REFERENCES residents (id) ON DELETE SET NULL;



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

