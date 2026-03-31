-- ============================================================================
-- CREATE TABLE STATEMENTS ONLY
-- Generated: 2026-03-30
-- ============================================================================

-- ---------------------------------------------------------------------------
-- BASE TABLE: public.users (required by app auth and seed scripts)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'staff', 'workers', 'admin', 'barangay_admin')),
  user_role text NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'staff', 'workers', 'admin', 'barangay_admin')),
  assigned_barangay text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- BASE TABLE: public.residents (required by resident flows and seed scripts)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  full_name text NOT NULL,
  birth_date date,
  sex text CHECK (sex IN ('Male', 'Female', 'Other')),
  barangay text NOT NULL,
  purok text NOT NULL,
  contact_number text,
  philhealth_no text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_residents_barangay ON public.residents(barangay);
CREATE INDEX IF NOT EXISTS idx_residents_full_name ON public.residents(full_name);

-- ---------------------------------------------------------------------------
-- BASE TABLE: public.barangay_profiles (required by profiling module)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.barangay_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_type text NOT NULL CHECK (membership_type IN ('member', 'dependent')),
  philhealth_no text,
  last_name text NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  suffix text,
  age integer CHECK (age >= 0 AND age <= 150),
  birthdate date,
  civil_status text CHECK (civil_status IN ('single', 'married', 'widowed', 'separated', 'annulled')),
  maiden_last_name text,
  maiden_middle_name text,
  educational_attainment text CHECK (educational_attainment IN ('no_formal', 'elementary', 'high_school', 'senior_high', 'vocational', 'college', 'post_grad')),
  employment_status text CHECK (employment_status IN ('employed', 'self_employed', 'unemployed', 'student', 'retired')),
  employed_in text CHECK (employed_in IN ('government', 'private')),
  occupation text,
  company_address text,
  religion text,
  blood_type text CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),

  mother_last_name text,
  mother_first_name text,
  mother_middle_name text,
  mother_birthdate date,
  father_last_name text,
  father_first_name text,
  father_middle_name text,
  father_birthdate date,
  spouse_last_name text,
  spouse_first_name text,
  spouse_birthdate date,

  current_barangay text,
  current_street text,
  current_city text,
  current_province text,
  permanent_barangay text,
  permanent_street text,
  permanent_city text,
  permanent_province text,
  email text,
  mobile text,

  is_pregnant text CHECK (is_pregnant IN ('yes', 'no')),
  pregnancy_months integer CHECK (pregnancy_months >= 0 AND pregnancy_months <= 10),
  gravida integer CHECK (gravida >= 0),
  para integer CHECK (para >= 0),
  lmp date,
  edd date,
  prenatal_checkup_date date,
  pregnancy_risk_level text CHECK (pregnancy_risk_level IN ('low', 'moderate', 'high')),
  pregnancy_remarks text,
  has_hypertension text,
  has_diabetes text,
  has_asthma text,
  has_heart_disease text,
  past_surgeries text,
  current_medications text,
  allergies text,
  hospitalization_history text,
  family_hypertension text,
  family_diabetes text,
  family_asthma text,
  family_cancer text,
  smoking_status text,
  alcohol_intake text,
  exercise_frequency text,
  dietary_pattern text,
  personal_history_notes text,

  past_medical_history text,
  pmh_specify_allergy text,
  pmh_specify_organ_cancer text,
  pmh_specify_hepatitis_type text,
  pmh_highest_blood_pressure text,
  pmh_specify_pulmonary_tb_category text,
  pmh_specify_extrapulmonary_tb_category text,
  pmh_others_specify text,
  past_surgical_history text,
  family_history text,
  fh_specify_allergy text,
  fh_specify_organ_cancer text,
  fh_specify_hepatitis_type text,
  fh_highest_blood_pressure text,
  fh_specify_pulmonary_tb_category text,
  fh_specify_extrapulmonary_tb_category text,
  fh_others_specify text,
  smoking_packs_per_year text,
  alcohol_bottles_per_day text,
  illicit_drugs text,
  sexually_active text,

  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barangay_profiles_current_barangay ON public.barangay_profiles(current_barangay);
CREATE INDEX IF NOT EXISTS idx_barangay_profiles_last_name ON public.barangay_profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_barangay_profiles_first_name ON public.barangay_profiles(first_name);


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/002_health_workers_tables.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL,
  vaccine_name text NOT NULL,
  dose_number integer,
  vaccine_date date NOT NULL,
  next_dose_date date,
  vaccination_site text,
  administered_by uuid,
  batch_number text,
  status text CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'overdue'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vaccination_records_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.maternal_health_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL,
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
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maternal_health_records_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.senior_assistance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL,
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
  recorded_by uuid,
  follow_up_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT senior_assistance_records_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS public.offline_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'synced'::text, 'failed'::text])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  synced_at timestamp with time zone,
  CONSTRAINT offline_queue_pkey PRIMARY KEY (id)
);

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


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/003_announcements_module.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid,
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


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/005_medication_inventory_module.sql
-- ---------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS public.medication_inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NULL REFERENCES public.medication_inventory(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor_id uuid NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/006_medical_consultation_records.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.medical_consultation_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- PATIENT INFORMATION (Section I)
  -- If resident_id is provided, pulls from residents table; otherwise uses manual entry
  resident_id uuid,
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
  recorded_by uuid, -- Worker who entered the data
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT medical_consultation_records_pkey PRIMARY KEY (id)
);


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/007_qr_scan_logs.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id  UUID        NOT NULL,
  scanned_by   UUID        NOT NULL,
  scanned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  facility_id  UUID        REFERENCES health_facilities(id),
  device_info  TEXT,
  notes        TEXT
);


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/pregnancy-profiling.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pregnancy_profiling_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  resident_id uuid NOT NULL,

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

  recorded_by uuid,
  updated_by uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pregnancy_profiling_records_resident_unique UNIQUE (resident_id)
);

