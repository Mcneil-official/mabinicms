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