-- ============================================================================
-- BASE USERS TABLE
-- Creates public.users used by app login/session logic and worker/staff modules
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_user_role ON public.users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_assigned_barangay ON public.users(assigned_barangay);
