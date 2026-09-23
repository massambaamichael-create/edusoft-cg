-- ============================================================
-- EduSoft CG — Identity & Access — first-login enforcement
-- Server-authoritative flag for temporary credentials
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.must_change_password IS
  'True while the account must replace its temporary password before accessing its workspace.';

CREATE INDEX IF NOT EXISTS idx_users_must_change_password
  ON public.users (must_change_password)
  WHERE must_change_password = true;
