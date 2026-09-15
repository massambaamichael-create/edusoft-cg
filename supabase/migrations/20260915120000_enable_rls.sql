-- ============================================================
-- EduSoft CG — Row Level Security (RLS) — FIXED
-- Multi-tenant isolation by school_id
-- ============================================================
-- Apply in Supabase SQL Editor (Run).
-- service_role bypasses RLS (needed for /api/teachers).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helper functions
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_director()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT r.name = 'Directeur'
     FROM public.users u
     JOIN public.roles r ON r.id = u.role_id
     WHERE u.auth_user_id = auth.uid()
     LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_director() TO authenticated;

-- ------------------------------------------------------------
-- 2. Enable RLS only on tables that exist
-- ------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles',
    'users',
    'teachers',
    'students',
    'cycles',
    'levels',
    'series',
    'subjects',
    'academic_years',
    'classes',
    'teacher_subjects',
    'class_subjects',
    'student_enrollments',
    'student_attendance',
    'assessments',
    'report_cards'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 3. ROLES
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;
CREATE POLICY "roles_select_authenticated"
  ON public.roles FOR SELECT TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- 4. USERS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "users_select_same_school" ON public.users;
CREATE POLICY "users_select_same_school"
  ON public.users FOR SELECT TO authenticated
  USING (
    school_id = public.get_my_school_id()
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "users_update_own_or_director" ON public.users;
CREATE POLICY "users_update_own_or_director"
  ON public.users FOR UPDATE TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR (public.is_director() AND school_id = public.get_my_school_id())
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "users_insert_director" ON public.users;
CREATE POLICY "users_insert_director"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 5. TEACHERS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "teachers_select_same_school" ON public.teachers;
CREATE POLICY "teachers_select_same_school"
  ON public.teachers FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "teachers_insert_director" ON public.teachers;
CREATE POLICY "teachers_insert_director"
  ON public.teachers FOR INSERT TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "teachers_update_director" ON public.teachers;
CREATE POLICY "teachers_update_director"
  ON public.teachers FOR UPDATE TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "teachers_delete_director" ON public.teachers;
CREATE POLICY "teachers_delete_director"
  ON public.teachers FOR DELETE TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 6. STUDENTS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "students_select_same_school" ON public.students;
CREATE POLICY "students_select_same_school"
  ON public.students FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "students_insert_director" ON public.students;
CREATE POLICY "students_insert_director"
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "students_update_director" ON public.students;
CREATE POLICY "students_update_director"
  ON public.students FOR UPDATE TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "students_delete_director" ON public.students;
CREATE POLICY "students_delete_director"
  ON public.students FOR DELETE TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 7. CYCLES / SUBJECTS / ACADEMIC_YEARS (have school_id)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "cycles_select_same_school" ON public.cycles;
CREATE POLICY "cycles_select_same_school"
  ON public.cycles FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "cycles_write_director" ON public.cycles;
CREATE POLICY "cycles_write_director"
  ON public.cycles FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "subjects_select_same_school" ON public.subjects;
CREATE POLICY "subjects_select_same_school"
  ON public.subjects FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "subjects_write_director" ON public.subjects;
CREATE POLICY "subjects_write_director"
  ON public.subjects FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "academic_years_select_same_school" ON public.academic_years;
CREATE POLICY "academic_years_select_same_school"
  ON public.academic_years FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "academic_years_write_director" ON public.academic_years;
CREATE POLICY "academic_years_write_director"
  ON public.academic_years FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

-- ------------------------------------------------------------
-- 8. LEVELS / SERIES — via cycle (in case no school_id column)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "levels_select_same_school" ON public.levels;
CREATE POLICY "levels_select_same_school"
  ON public.levels FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cycles c
      WHERE c.id = levels.cycle_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "levels_write_director" ON public.levels;
CREATE POLICY "levels_write_director"
  ON public.levels FOR ALL TO authenticated
  USING (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.cycles c
      WHERE c.id = levels.cycle_id
        AND c.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.cycles c
      WHERE c.id = levels.cycle_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "series_select_same_school" ON public.series;
CREATE POLICY "series_select_same_school"
  ON public.series FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cycles c
      WHERE c.id = series.cycle_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "series_write_director" ON public.series;
CREATE POLICY "series_write_director"
  ON public.series FOR ALL TO authenticated
  USING (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.cycles c
      WHERE c.id = series.cycle_id
        AND c.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.cycles c
      WHERE c.id = series.cycle_id
        AND c.school_id = public.get_my_school_id()
    )
  );

-- ------------------------------------------------------------
-- 9. CLASSES
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "classes_select_same_school" ON public.classes;
CREATE POLICY "classes_select_same_school"
  ON public.classes FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "classes_insert_director" ON public.classes;
CREATE POLICY "classes_insert_director"
  ON public.classes FOR INSERT TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "classes_update_director" ON public.classes;
CREATE POLICY "classes_update_director"
  ON public.classes FOR UPDATE TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "classes_delete_director" ON public.classes;
CREATE POLICY "classes_delete_director"
  ON public.classes FOR DELETE TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 10. Junction tables (no school_id — join parent)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "teacher_subjects_select_same_school" ON public.teacher_subjects;
CREATE POLICY "teacher_subjects_select_same_school"
  ON public.teacher_subjects FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_subjects.teacher_id
        AND t.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "teacher_subjects_write_director" ON public.teacher_subjects;
CREATE POLICY "teacher_subjects_write_director"
  ON public.teacher_subjects FOR ALL TO authenticated
  USING (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_subjects.teacher_id
        AND t.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_subjects.teacher_id
        AND t.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "class_subjects_select_same_school" ON public.class_subjects;
CREATE POLICY "class_subjects_select_same_school"
  ON public.class_subjects FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "class_subjects_write_director" ON public.class_subjects;
CREATE POLICY "class_subjects_write_director"
  ON public.class_subjects FOR ALL TO authenticated
  USING (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND c.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "student_enrollments_select_same_school" ON public.student_enrollments;
CREATE POLICY "student_enrollments_select_same_school"
  ON public.student_enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = student_enrollments.class_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "student_enrollments_write_director" ON public.student_enrollments;
CREATE POLICY "student_enrollments_write_director"
  ON public.student_enrollments FOR ALL TO authenticated
  USING (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = student_enrollments.class_id
        AND c.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    public.is_director()
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = student_enrollments.class_id
        AND c.school_id = public.get_my_school_id()
    )
  );

-- ------------------------------------------------------------
-- 11. student_attendance — ONLY via students (no school_id ref)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "student_attendance_select_same_school" ON public.student_attendance;
CREATE POLICY "student_attendance_select_same_school"
  ON public.student_attendance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_attendance.student_id
        AND s.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "student_attendance_write_same_school" ON public.student_attendance;
CREATE POLICY "student_attendance_write_same_school"
  ON public.student_attendance FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_attendance.student_id
        AND s.school_id = public.get_my_school_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_attendance.student_id
        AND s.school_id = public.get_my_school_id()
    )
  );

-- ------------------------------------------------------------
-- 12. assessments / report_cards — director only (no school_id)
--     Tighten later when schema is known
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "assessments_select_authenticated" ON public.assessments;
CREATE POLICY "assessments_select_authenticated"
  ON public.assessments FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "assessments_write_director" ON public.assessments;
CREATE POLICY "assessments_write_director"
  ON public.assessments FOR ALL TO authenticated
  USING (public.is_director())
  WITH CHECK (public.is_director());

DROP POLICY IF EXISTS "report_cards_select_authenticated" ON public.report_cards;
CREATE POLICY "report_cards_select_authenticated"
  ON public.report_cards FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "report_cards_write_director" ON public.report_cards;
CREATE POLICY "report_cards_write_director"
  ON public.report_cards FOR ALL TO authenticated
  USING (public.is_director())
  WITH CHECK (public.is_director());
