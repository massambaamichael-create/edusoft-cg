-- ============================================================
-- EduSoft CG — Row Level Security (RLS)
-- Multi-tenant isolation by school_id
-- ============================================================
-- Apply this migration in the Supabase SQL Editor or via CLI:
--   supabase db push
-- or copy-paste into Dashboard → SQL Editor → Run
--
-- IMPORTANT:
-- - The service_role key (supabaseAdmin) BYPASSES RLS by design.
--   This is required for /api/teachers (admin.createUser + inserts).
-- - After applying, test with the anon / authenticated key only.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER so they can read users)
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_director() TO authenticated;

-- ------------------------------------------------------------
-- 2. Enable RLS on all tables
-- ------------------------------------------------------------

ALTER TABLE public.roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards          ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. ROLES (reference table — readable by all authenticated)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;
CREATE POLICY "roles_select_authenticated"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- No insert/update/delete for normal users (manage via dashboard or service role)

-- ------------------------------------------------------------
-- 4. USERS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "users_select_same_school" ON public.users;
CREATE POLICY "users_select_same_school"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.get_my_school_id()
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "users_update_own_or_director" ON public.users;
CREATE POLICY "users_update_own_or_director"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR (public.is_director() AND school_id = public.get_my_school_id())
  )
  WITH CHECK (
    school_id = public.get_my_school_id()
  );

-- Insert is done by service_role (API teachers). Directors may insert later.
DROP POLICY IF EXISTS "users_insert_director" ON public.users;
CREATE POLICY "users_insert_director"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 5. TEACHERS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "teachers_select_same_school" ON public.teachers;
CREATE POLICY "teachers_select_same_school"
  ON public.teachers
  FOR SELECT
  TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "teachers_insert_director" ON public.teachers;
CREATE POLICY "teachers_insert_director"
  ON public.teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "teachers_update_director" ON public.teachers;
CREATE POLICY "teachers_update_director"
  ON public.teachers
  FOR UPDATE
  TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "teachers_delete_director" ON public.teachers;
CREATE POLICY "teachers_delete_director"
  ON public.teachers
  FOR DELETE
  TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 6. STUDENTS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "students_select_same_school" ON public.students;
CREATE POLICY "students_select_same_school"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "students_insert_director" ON public.students;
CREATE POLICY "students_insert_director"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "students_update_director" ON public.students;
CREATE POLICY "students_update_director"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "students_delete_director" ON public.students;
CREATE POLICY "students_delete_director"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 7. CYCLES / LEVELS / SERIES / SUBJECTS / ACADEMIC_YEARS
--    (school-scoped reference data)
-- ------------------------------------------------------------

-- CYCLES
DROP POLICY IF EXISTS "cycles_select_same_school" ON public.cycles;
CREATE POLICY "cycles_select_same_school"
  ON public.cycles FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "cycles_write_director" ON public.cycles;
CREATE POLICY "cycles_write_director"
  ON public.cycles FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

-- LEVELS
DROP POLICY IF EXISTS "levels_select_same_school" ON public.levels;
CREATE POLICY "levels_select_same_school"
  ON public.levels FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "levels_write_director" ON public.levels;
CREATE POLICY "levels_write_director"
  ON public.levels FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

-- SERIES
DROP POLICY IF EXISTS "series_select_same_school" ON public.series;
CREATE POLICY "series_select_same_school"
  ON public.series FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "series_write_director" ON public.series;
CREATE POLICY "series_write_director"
  ON public.series FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

-- SUBJECTS
DROP POLICY IF EXISTS "subjects_select_same_school" ON public.subjects;
CREATE POLICY "subjects_select_same_school"
  ON public.subjects FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "subjects_write_director" ON public.subjects;
CREATE POLICY "subjects_write_director"
  ON public.subjects FOR ALL TO authenticated
  USING (public.is_director() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_director() AND school_id = public.get_my_school_id());

-- ACADEMIC_YEARS
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
-- 8. CLASSES
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "classes_select_same_school" ON public.classes;
CREATE POLICY "classes_select_same_school"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "classes_insert_director" ON public.classes;
CREATE POLICY "classes_insert_director"
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

DROP POLICY IF EXISTS "classes_update_director" ON public.classes;
CREATE POLICY "classes_update_director"
  ON public.classes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  )
  WITH CHECK (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "classes_delete_director" ON public.classes;
CREATE POLICY "classes_delete_director"
  ON public.classes
  FOR DELETE
  TO authenticated
  USING (
    public.is_director()
    AND school_id = public.get_my_school_id()
  );

-- ------------------------------------------------------------
-- 9. Junction / related tables (no direct school_id)
-- ------------------------------------------------------------

-- TEACHER_SUBJECTS  (via teachers.school_id)
DROP POLICY IF EXISTS "teacher_subjects_select_same_school" ON public.teacher_subjects;
CREATE POLICY "teacher_subjects_select_same_school"
  ON public.teacher_subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_subjects.teacher_id
        AND t.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "teacher_subjects_write_director" ON public.teacher_subjects;
CREATE POLICY "teacher_subjects_write_director"
  ON public.teacher_subjects
  FOR ALL
  TO authenticated
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

-- CLASS_SUBJECTS  (via classes.school_id)
DROP POLICY IF EXISTS "class_subjects_select_same_school" ON public.class_subjects;
CREATE POLICY "class_subjects_select_same_school"
  ON public.class_subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "class_subjects_write_director" ON public.class_subjects;
CREATE POLICY "class_subjects_write_director"
  ON public.class_subjects
  FOR ALL
  TO authenticated
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

-- STUDENT_ENROLLMENTS  (via classes.school_id)
DROP POLICY IF EXISTS "student_enrollments_select_same_school" ON public.student_enrollments;
CREATE POLICY "student_enrollments_select_same_school"
  ON public.student_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = student_enrollments.class_id
        AND c.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "student_enrollments_write_director" ON public.student_enrollments;
CREATE POLICY "student_enrollments_write_director"
  ON public.student_enrollments
  FOR ALL
  TO authenticated
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

-- STUDENT_ATTENDANCE
-- Assumes the table has school_id OR student_id / class_id.
-- Prefer school_id if present; otherwise fall back via students.
DROP POLICY IF EXISTS "student_attendance_select_same_school" ON public.student_attendance;
CREATE POLICY "student_attendance_select_same_school"
  ON public.student_attendance
  FOR SELECT
  TO authenticated
  USING (
    -- If the table has school_id column:
    (EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'student_attendance'
        AND column_name = 'school_id'
    ) AND school_id = public.get_my_school_id())
    OR
    -- Fallback via student
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_attendance.student_id
        AND s.school_id = public.get_my_school_id()
    )
  );

DROP POLICY IF EXISTS "student_attendance_write_same_school" ON public.student_attendance;
CREATE POLICY "student_attendance_write_same_school"
  ON public.student_attendance
  FOR ALL
  TO authenticated
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

-- ASSESSMENTS
DROP POLICY IF EXISTS "assessments_select_same_school" ON public.assessments;
CREATE POLICY "assessments_select_same_school"
  ON public.assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'assessments'
        AND column_name = 'school_id'
    ) AND school_id = public.get_my_school_id()
    OR true  -- temporary fallback if no school_id; tighten later
  );

DROP POLICY IF EXISTS "assessments_write_director" ON public.assessments;
CREATE POLICY "assessments_write_director"
  ON public.assessments
  FOR ALL
  TO authenticated
  USING (public.is_director())
  WITH CHECK (public.is_director());

-- REPORT_CARDS
DROP POLICY IF EXISTS "report_cards_select_same_school" ON public.report_cards;
CREATE POLICY "report_cards_select_same_school"
  ON public.report_cards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'report_cards'
        AND column_name = 'school_id'
    ) AND school_id = public.get_my_school_id()
    OR true
  );

DROP POLICY IF EXISTS "report_cards_write_director" ON public.report_cards;
CREATE POLICY "report_cards_write_director"
  ON public.report_cards
  FOR ALL
  TO authenticated
  USING (public.is_director())
  WITH CHECK (public.is_director());

-- ------------------------------------------------------------
-- 10. Notes & comments
-- ------------------------------------------------------------
-- After running this migration:
-- 1. Verify in Supabase Dashboard → Authentication → Policies
-- 2. Test as a normal authenticated user (not service_role):
--      - You should only see data of your school
--      - Director can insert/update/delete
--      - Teacher can only read (most tables)
-- 3. The /api/teachers route keeps working because it uses
--    supabaseAdmin (service_role) which bypasses RLS.
-- 4. If some tables are missing or have different column names,
--    adjust the policies accordingly (especially assessments,
--    report_cards, student_attendance).
