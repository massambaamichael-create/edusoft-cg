-- EduSoft CG — Identity & Access expansion for Parent / Élève
-- Applied to the active EduSoft CG Supabase project.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS login_identifier text;

UPDATE public.users
SET login_identifier = lower(trim(email))
WHERE login_identifier IS NULL
  AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_login_identifier_key
  ON public.users (lower(login_identifier))
  WHERE login_identifier IS NOT NULL;

ALTER TABLE public.parents
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parents_user_id_fkey') THEN
    ALTER TABLE public.parents
      ADD CONSTRAINT parents_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_user_id_fkey') THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS parents_user_id_key ON public.parents(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_key ON public.students(user_id) WHERE user_id IS NOT NULL;

INSERT INTO public.roles (name, description)
SELECT 'Parent', 'Portail parent / tuteur'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'Parent');

INSERT INTO public.roles (name, description)
SELECT 'Élève', 'Portail élève'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'Élève');

INSERT INTO public.permissions (code, name, action, module, description, is_active)
SELECT 'portal.parent.read', 'Accéder au portail parent', 'read', 'portal',
       'Permet au parent d''accéder uniquement aux données de ses enfants.', true
WHERE NOT EXISTS (SELECT 1 FROM public.permissions WHERE code = 'portal.parent.read');

INSERT INTO public.permissions (code, name, action, module, description, is_active)
SELECT 'portal.student.read', 'Accéder au portail élève', 'read', 'portal',
       'Permet à l''élève d''accéder uniquement à ses propres données.', true
WHERE NOT EXISTS (SELECT 1 FROM public.permissions WHERE code = 'portal.student.read');

INSERT INTO public.role_permissions (school_id, role_id, permission_id, granted)
SELECT s.id, r.id, p.id, true
FROM public.schools s
CROSS JOIN public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Parent' AND p.code = 'portal.parent.read'
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.school_id=s.id AND rp.role_id=r.id AND rp.permission_id=p.id
  );

INSERT INTO public.role_permissions (school_id, role_id, permission_id, granted)
SELECT s.id, r.id, p.id, true
FROM public.schools s
CROSS JOIN public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Élève' AND p.code = 'portal.student.read'
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.school_id=s.id AND rp.role_id=r.id AND rp.permission_id=p.id
  );

CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT id FROM public.users WHERE auth_user_id=auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_my_parent_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT id FROM public.parents WHERE user_id=public.get_my_user_id() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT id FROM public.students WHERE user_id=public.get_my_user_id() LIMIT 1 $$;

DROP POLICY IF EXISTS students_select_school ON public.students;
CREATE POLICY students_select_scoped ON public.students
FOR SELECT TO authenticated
USING (
  (school_id=public.get_my_school_id() AND (
    public.has_permission('students.read') OR public.has_permission('students.create')
    OR public.has_permission('students.update') OR public.has_permission('students.archive')
  ))
  OR id=public.get_my_student_id()
  OR EXISTS (
    SELECT 1 FROM public.student_parents sp
    WHERE sp.student_id=public.students.id AND sp.parent_id=public.get_my_parent_id()
  )
);

DROP POLICY IF EXISTS parents_select_rbac ON public.parents;
CREATE POLICY parents_select_scoped ON public.parents
FOR SELECT TO authenticated
USING (
  (school_id=public.get_my_school_id() AND (
    public.has_permission('parents.read') OR public.has_permission('parents.manage')
  ))
  OR id=public.get_my_parent_id()
);

DROP POLICY IF EXISTS student_parents_select_rbac ON public.student_parents;
CREATE POLICY student_parents_select_scoped ON public.student_parents
FOR SELECT TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id=student_parents.student_id AND s.school_id=public.get_my_school_id()
    )
    AND (public.has_permission('parents.read') OR public.has_permission('parents.manage'))
  )
  OR parent_id=public.get_my_parent_id()
  OR student_id=public.get_my_student_id()
);

CREATE INDEX IF NOT EXISTS student_parents_parent_id_idx ON public.student_parents(parent_id);
CREATE INDEX IF NOT EXISTS student_parents_student_id_idx ON public.student_parents(student_id);

REVOKE EXECUTE ON FUNCTION public.get_my_user_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_parent_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_student_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_parent_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_student_id() TO authenticated;
