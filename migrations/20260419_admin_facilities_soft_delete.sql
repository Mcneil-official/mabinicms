-- Add soft-delete columns for admin-managed facilities.
ALTER TABLE public.health_facilities
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivated_by uuid,
  ADD COLUMN IF NOT EXISTS deactivation_reason text;

CREATE INDEX IF NOT EXISTS idx_health_facilities_is_active
  ON public.health_facilities (is_active);

CREATE INDEX IF NOT EXISTS idx_health_facilities_barangay_is_active
  ON public.health_facilities (barangay, is_active);
