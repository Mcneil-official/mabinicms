-- Persisted system settings for admin controls.
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at
  ON public.system_settings (updated_at DESC);
