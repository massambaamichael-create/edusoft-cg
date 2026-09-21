/**
 * Inscriptions — contextualisées par année scolaire (PRD).
 * Source unique : student_enrollments (pas de double fiche élève).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type EnrollmentStudent = { id: string; first_name: string | null; last_name: string | null; school_id: string | null };
type EnrollmentClass = { id: string; name: string | null; school_id: string | null };
type EnrollmentYear = { id: string; name: string | null };
type EnrollmentQueryRow = {
  id: string;
  school_id?: string | null;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  status: string | null;
  students?: EnrollmentStudent | null;
  classes?: EnrollmentClass | null;
  academic_years?: EnrollmentYear | null;
};

export type EnrollmentRow = {
  id: string;
  school_id: string | null;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  status: string | null;
  student_name: string;
  class_name: string;
  year_name: string | null;
};

export async function fetchEnrollmentsForSchool(
  supabase: SupabaseClient,
  schoolId: string
): Promise<{ data: EnrollmentRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .select(
      `
      id,
      school_id,
      student_id,
      class_id,
      academic_year_id,
      status,
      students ( id, first_name, last_name, school_id ),
      classes ( id, name, school_id ),
      academic_years ( id, name )
    `
    )
    .eq("school_id", schoolId);

  if (error) {
    // Fallback without school_id column on enrollments
    const fallback = await supabase.from("student_enrollments").select(`
      id,
      student_id,
      class_id,
      academic_year_id,
      status,
      students ( id, first_name, last_name, school_id ),
      classes ( id, name, school_id ),
      academic_years ( id, name )
    `);

    if (fallback.error) {
      return { data: [], error: error.message };
    }

    const rows = ((fallback.data || []) as EnrollmentQueryRow[])
      .filter(
        (r) =>
          r.students?.school_id === schoolId || r.classes?.school_id === schoolId
      )
      .map(mapEnrollment);

    return { data: rows, error: null };
  }

  return {
    data: ((data || []) as EnrollmentQueryRow[]).map(mapEnrollment),
    error: null,
  };
}

function mapEnrollment(r: EnrollmentQueryRow): EnrollmentRow {
  const st = r.students;
  const cl = r.classes;
  const yr = r.academic_years;
  const studentName = [st?.last_name, st?.first_name].filter(Boolean).join(" ");

  return {
    id: r.id,
    school_id: r.school_id ?? st?.school_id ?? null,
    student_id: r.student_id,
    class_id: r.class_id,
    academic_year_id: r.academic_year_id,
    status: r.status ?? null,
    student_name: studentName || r.student_id?.slice?.(0, 8) || "—",
    class_name: cl?.name || "—",
    year_name: yr?.name || null,
  };
}
