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

