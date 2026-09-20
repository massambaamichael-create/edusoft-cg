-- ============================================================
-- EduSoft CG — Programme & Progression — Core référentiel
-- Phase 1 : Programme + versions
-- ============================================================
-- IMPORTANT :
-- - Réutilise cycles / levels / series / subjects existants.
-- - Un programme appartient à un CONTEXTE pédagogique, pas à une classe.
-- - L'identité pédagogique est : école + cycle + niveau + série/filière
--   (si applicable) + matière.
-- - L'année scolaire sera portée par l'utilisation/progression, pas par
--   le référentiel lui-même, afin de permettre sa réutilisation.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE RESTRICT,
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE RESTRICT,
  series_id uuid NULL REFERENCES public.series(id) ON DELETE RESTRICT,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  code text NULL,
  name text NOT NULL,
  description text NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS programs_context_unique
  ON public.programs (
    school_id,
    cycle_id,
    level_id,
    COALESCE(series_id, '00000000-0000-0000-0000-000000000000'::uuid),
    subject_id
  );

CREATE INDEX IF NOT EXISTS programs_school_idx
  ON public.programs (school_id);

CREATE INDEX IF NOT EXISTS programs_context_idx
  ON public.programs (cycle_id, level_id, series_id, subject_id);

CREATE TABLE IF NOT EXISTS public.program_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  name text NOT NULL,
  description text NULL,
  source_type text NULL
    CHECK (source_type IS NULL OR source_type IN ('official', 'school', 'imported', 'other')),
  source_reference text NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  effective_from date NULL,
  effective_to date NULL,
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  published_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_versions_unique_version UNIQUE (program_id, version_number),
  CONSTRAINT program_versions_dates_valid
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS program_versions_program_idx
  ON public.program_versions (program_id);

-- Vérifie que les références pédagogiques appartiennent au même contexte.
CREATE OR REPLACE FUNCTION public.validate_program_context()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cycle_school_id uuid;
  level_cycle_id uuid;
  series_cycle_id uuid;
  subject_school_id uuid;
BEGIN
  SELECT c.school_id INTO cycle_school_id
  FROM public.cycles c
  WHERE c.id = NEW.cycle_id;

  IF cycle_school_id IS NULL OR cycle_school_id <> NEW.school_id THEN
    RAISE EXCEPTION 'Programme invalide : cycle hors de l''école';
  END IF;

  SELECT l.cycle_id INTO level_cycle_id
  FROM public.levels l
  WHERE l.id = NEW.level_id;

  IF level_cycle_id IS NULL OR level_cycle_id <> NEW.cycle_id THEN
    RAISE EXCEPTION 'Programme invalide : niveau hors du cycle';
  END IF;

  IF NEW.series_id IS NOT NULL THEN
    SELECT s.cycle_id INTO series_cycle_id
    FROM public.series s
    WHERE s.id = NEW.series_id;

    IF series_cycle_id IS NULL OR series_cycle_id <> NEW.cycle_id THEN
      RAISE EXCEPTION 'Programme invalide : série/filière hors du cycle';
    END IF;
  END IF;

  SELECT s.school_id INTO subject_school_id
  FROM public.subjects s
  WHERE s.id = NEW.subject_id;

  IF subject_school_id IS NULL OR subject_school_id <> NEW.school_id THEN
    RAISE EXCEPTION 'Programme invalide : matière hors de l''école';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_program_context ON public.programs;
CREATE TRIGGER trg_validate_program_context
BEFORE INSERT OR UPDATE OF school_id, cycle_id, level_id, series_id, subject_id
ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.validate_program_context();

-- Mise à jour simple du timestamp.
CREATE OR REPLACE FUNCTION public.touch_program_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_program_updated_at ON public.programs;
CREATE TRIGGER trg_touch_program_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.touch_program_updated_at();

DROP TRIGGER IF EXISTS trg_touch_program_version_updated_at ON public.program_versions;
CREATE TRIGGER trg_touch_program_version_updated_at
BEFORE UPDATE ON public.program_versions
FOR EACH ROW
EXECUTE FUNCTION public.touch_program_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_select_same_school" ON public.programs;
CREATE POLICY "programs_select_same_school"
  ON public.programs FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "programs_manage_pedagogy" ON public.programs;
CREATE POLICY "programs_manage_pedagogy"
  ON public.programs FOR ALL TO authenticated
  USING (
    public.get_my_role_name() IN ('Directeur', 'Directeur des Études')
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (
    public.get_my_role_name() IN ('Directeur', 'Directeur des Études')
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "program_versions_select_same_school" ON public.program_versions;
CREATE POLICY "program_versions_select_same_school"
  ON public.program_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_versions.program_id
        AND p.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "program_versions_manage_pedagogy" ON public.program_versions;
CREATE POLICY "program_versions_manage_pedagogy"
  ON public.program_versions FOR ALL TO authenticated
  USING (
    public.get_my_role_name() IN ('Directeur', 'Directeur des Études')
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_versions.program_id
        AND p.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    public.get_my_role_name() IN ('Directeur', 'Directeur des Études')
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_versions.program_id
        AND p.school_id = public.get_my_school_id()
    )
  );

COMMENT ON TABLE public.programs IS
'Référentiel unique des programmes par contexte école/cycle/niveau/série-filière/matière. Ne pas dupliquer par classe.';

COMMENT ON TABLE public.program_versions IS
'Versions historisées du référentiel programme. La progression par année scolaire sera gérée dans une étape ultérieure.';
