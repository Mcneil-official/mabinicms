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

