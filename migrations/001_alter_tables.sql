-- ============================================================================
-- ALTER TABLE STATEMENTS ONLY
-- Generated: 2026-03-30
-- ============================================================================


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/001_yakap_applications_add_form_data.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.yakap_applications') IS NULL THEN
    RAISE NOTICE 'Skipping yakap_applications ALTER block: table does not exist.';
    RETURN;
  END IF;

  ALTER TABLE public.yakap_applications
    ADD COLUMN IF NOT EXISTS resident_id UUID NULL;

  ALTER TABLE public.yakap_applications
    ADD COLUMN IF NOT EXISTS form_data JSONB NULL;

  ALTER TABLE public.yakap_applications
    DROP CONSTRAINT IF EXISTS yakap_applications_membership_type_check;

  ALTER TABLE public.yakap_applications
    ADD CONSTRAINT yakap_applications_membership_type_check CHECK (
      membership_type = ANY(ARRAY['individual'::text, 'family'::text, 'senior'::text, 'pwd'::text])
    );
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/002_health_workers_tables.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'user'
      CHECK (user_role = ANY (ARRAY['user'::text, 'staff'::text, 'workers'::text]));
  END IF;

  IF to_regclass('public.vaccination_records') IS NOT NULL THEN
    ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.maternal_health_records') IS NOT NULL THEN
    ALTER TABLE public.maternal_health_records ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.senior_assistance_records') IS NOT NULL THEN
    ALTER TABLE public.senior_assistance_records ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.health_metrics') IS NOT NULL THEN
    ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.offline_queue') IS NOT NULL THEN
    ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/004_announcements_add_poster_image.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.announcements') IS NOT NULL THEN
    ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS poster_image_url text;
  END IF;
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/006_barangay_profiles_merge_pregnancy_history.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.barangay_profiles') IS NULL THEN
    RAISE NOTICE 'Skipping barangay_profiles pregnancy-history ALTER block: table does not exist.';
    RETURN;
  END IF;

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
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/006_medical_consultation_records.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.medical_consultation_records') IS NOT NULL THEN
    ALTER TABLE public.medical_consultation_records ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/007_barangay_profiles_doh_history_fields.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.barangay_profiles') IS NULL THEN
    RAISE NOTICE 'Skipping barangay_profiles DOH-history ALTER block: table does not exist.';
    RETURN;
  END IF;

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
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/007_qr_scan_logs.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.qr_scan_logs') IS NOT NULL THEN
    ALTER TABLE public.qr_scan_logs DISABLE ROW LEVEL SECURITY;
  END IF;
END
$$;


-- ---------------------------------------------------------------------------
-- SOURCE: migrations/pregnancy-profiling.sql
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.pregnancy_profiling_records') IS NOT NULL THEN
    ALTER TABLE public.pregnancy_profiling_records ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

