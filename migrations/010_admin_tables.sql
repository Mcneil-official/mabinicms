-- ============================================================================
-- ADMIN MODULE TABLES
-- Tables for system administration, audit logging, and settings
-- ============================================================================

-- 1. AUDIT LOGS TABLE (for comprehensive audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);

COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (e.g., CREATE_USER, UPDATE_USER, DELETE_USER)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (e.g., user, facility, setting)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.status IS 'Whether the action succeeded or failed';

-- 2. SYSTEM SETTINGS TABLE (for flexible system configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_sensitive boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_key_unique UNIQUE (key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

COMMENT ON TABLE public.system_settings IS 'Flexible key-value store for system-wide settings and configuration';
COMMENT ON COLUMN public.system_settings.key IS 'Unique setting key (e.g., app_name, max_upload_size)';
COMMENT ON COLUMN public.system_settings.value IS 'Setting value stored as JSONB for flexibility';
COMMENT ON COLUMN public.system_settings.category IS 'Category for grouping settings (general, email, upload, etc)';
COMMENT ON COLUMN public.system_settings.is_sensitive IS 'Whether this setting contains sensitive data (passwords, API keys)';

-- 3. Insert default system settings
INSERT INTO public.system_settings (key, value, category, description, is_sensitive) VALUES
  ('app_name', '"MabiniCare"', 'general', 'Application name', false),
  ('app_version', '"1.0.0"', 'general', 'Application version', false),
  ('maintenance_mode', 'false', 'general', 'Whether app is in maintenance mode', false),
  ('max_file_upload_size', '10485760', 'upload', 'Maximum file upload size in bytes (10MB)', false),
  ('allowed_file_types', '"jpg,jpeg,png,pdf,doc,docx"', 'upload', 'Comma-separated allowed file types', false),
  ('session_timeout_minutes', '30', 'security', 'Session timeout in minutes', false),
  ('enable_two_factor_auth', 'false', 'security', 'Whether to enable 2FA', false),
  ('email_notifications_enabled', 'true', 'email', 'Whether to send email notifications', false),
  ('smtp_host', '""', 'email', 'SMTP server host', true),
  ('smtp_port', '587', 'email', 'SMTP server port', false),
  ('backup_frequency', '"daily"', 'backup', 'How often to backup data (daily, weekly, monthly)', false),
  ('backup_retention_days', '30', 'backup', 'How many days to keep backups', false)
ON CONFLICT (key) DO NOTHING;

-- 4. UPDATE USERS TABLE TO ADD SOFT DELETE AND LAST LOGIN
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deactivated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deactivation_reason text;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON public.users(last_login_at DESC);

COMMENT ON COLUMN public.users.is_active IS 'Whether this user account is active (soft delete)';
COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN public.users.deactivated_at IS 'Timestamp when user was deactivated (soft delete)';
COMMENT ON COLUMN public.users.deactivated_by IS 'Admin user who deactivated this account';
COMMENT ON COLUMN public.users.deactivation_reason IS 'Reason for deactivation';
