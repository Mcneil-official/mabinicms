-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (RUN AFTER BASE TABLES EXIST)
-- This script safely adds FK constraints only when required tables exist.
-- Generated: 2026-03-30
-- ============================================================================

DO $$
BEGIN
  -- vaccination_records
  IF to_regclass('public.vaccination_records') IS NOT NULL
     AND to_regclass('public.residents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'vaccination_records_resident_id_fkey'
     ) THEN
    ALTER TABLE public.vaccination_records
      ADD CONSTRAINT vaccination_records_resident_id_fkey
      FOREIGN KEY (resident_id) REFERENCES public.residents(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.vaccination_records') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'vaccination_records_administered_by_fkey'
     ) THEN
    ALTER TABLE public.vaccination_records
      ADD CONSTRAINT vaccination_records_administered_by_fkey
      FOREIGN KEY (administered_by) REFERENCES public.users(id);
  END IF;

  -- maternal_health_records
  IF to_regclass('public.maternal_health_records') IS NOT NULL
     AND to_regclass('public.residents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'maternal_health_records_resident_id_fkey'
     ) THEN
    ALTER TABLE public.maternal_health_records
      ADD CONSTRAINT maternal_health_records_resident_id_fkey
      FOREIGN KEY (resident_id) REFERENCES public.residents(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.maternal_health_records') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'maternal_health_records_recorded_by_fkey'
     ) THEN
    ALTER TABLE public.maternal_health_records
      ADD CONSTRAINT maternal_health_records_recorded_by_fkey
      FOREIGN KEY (recorded_by) REFERENCES public.users(id);
  END IF;

  -- senior_assistance_records
  IF to_regclass('public.senior_assistance_records') IS NOT NULL
     AND to_regclass('public.residents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'senior_assistance_records_resident_id_fkey'
     ) THEN
    ALTER TABLE public.senior_assistance_records
      ADD CONSTRAINT senior_assistance_records_resident_id_fkey
      FOREIGN KEY (resident_id) REFERENCES public.residents(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.senior_assistance_records') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'senior_assistance_records_recorded_by_fkey'
     ) THEN
    ALTER TABLE public.senior_assistance_records
      ADD CONSTRAINT senior_assistance_records_recorded_by_fkey
      FOREIGN KEY (recorded_by) REFERENCES public.users(id);
  END IF;

  -- offline_queue
  IF to_regclass('public.offline_queue') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'offline_queue_user_id_fkey'
     ) THEN
    ALTER TABLE public.offline_queue
      ADD CONSTRAINT offline_queue_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- announcements
  IF to_regclass('public.announcements') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'announcements_created_by_fkey'
     ) THEN
    ALTER TABLE public.announcements
      ADD CONSTRAINT announcements_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- medical_consultation_records
  IF to_regclass('public.medical_consultation_records') IS NOT NULL
     AND to_regclass('public.residents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'medical_consultation_records_resident_id_fkey'
     ) THEN
    ALTER TABLE public.medical_consultation_records
      ADD CONSTRAINT medical_consultation_records_resident_id_fkey
      FOREIGN KEY (resident_id) REFERENCES public.residents(id) ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.medical_consultation_records') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'medical_consultation_records_recorded_by_fkey'
     ) THEN
    ALTER TABLE public.medical_consultation_records
      ADD CONSTRAINT medical_consultation_records_recorded_by_fkey
      FOREIGN KEY (recorded_by) REFERENCES public.users(id);
  END IF;

  -- qr_scan_logs
  IF to_regclass('public.qr_scan_logs') IS NOT NULL
     AND to_regclass('public.residents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_resident_id_fkey'
     ) THEN
    ALTER TABLE public.qr_scan_logs
      ADD CONSTRAINT qr_scan_logs_resident_id_fkey
      FOREIGN KEY (resident_id) REFERENCES public.residents(id);
  END IF;

  IF to_regclass('public.qr_scan_logs') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_scanned_by_fkey'
     ) THEN
    ALTER TABLE public.qr_scan_logs
      ADD CONSTRAINT qr_scan_logs_scanned_by_fkey
      FOREIGN KEY (scanned_by) REFERENCES public.users(id);
  END IF;

  IF to_regclass('public.qr_scan_logs') IS NOT NULL
     AND to_regclass('public.health_facilities') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_facility_id_fkey'
     ) THEN
    ALTER TABLE public.qr_scan_logs
      ADD CONSTRAINT qr_scan_logs_facility_id_fkey
      FOREIGN KEY (facility_id) REFERENCES public.health_facilities(id);
  END IF;

  -- pregnancy_profiling_records
  IF to_regclass('public.pregnancy_profiling_records') IS NOT NULL
     AND to_regclass('public.residents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'pregnancy_profiling_records_resident_id_fkey'
     ) THEN
    ALTER TABLE public.pregnancy_profiling_records
      ADD CONSTRAINT pregnancy_profiling_records_resident_id_fkey
      FOREIGN KEY (resident_id) REFERENCES public.residents(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.pregnancy_profiling_records') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'pregnancy_profiling_records_recorded_by_fkey'
     ) THEN
    ALTER TABLE public.pregnancy_profiling_records
      ADD CONSTRAINT pregnancy_profiling_records_recorded_by_fkey
      FOREIGN KEY (recorded_by) REFERENCES public.users(id);
  END IF;

  IF to_regclass('public.pregnancy_profiling_records') IS NOT NULL
     AND to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'pregnancy_profiling_records_updated_by_fkey'
     ) THEN
    ALTER TABLE public.pregnancy_profiling_records
      ADD CONSTRAINT pregnancy_profiling_records_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.users(id);
  END IF;
END
$$;
