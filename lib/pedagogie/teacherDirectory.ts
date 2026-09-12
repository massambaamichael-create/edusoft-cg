import { supabase } from "@/lib/supabase";
import {
  loadTeacherAssignmentsForAcademicYear,
  type TeacherAssignment,
} from "@/lib/pedagogie/teacherAssignments";

export type TeacherDirectoryClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  coefficient: number;
};

export type TeacherDirectoryData = {
  assignments: TeacherAssignment[];
  classSubjects: TeacherDirectoryClassSubject[];
};

/**
 * Loads the canonical pedagogical assignment graph for one school/year.
 *
 * The teacher directory must not read the legacy teacher_subjects table:
 * teacher_assignments is the single source of truth for who teaches which
 * class subject in an academic year.
 */
export async function loadTeacherDirectoryData({
  schoolId,
  academicYearId,
}: {
  schoolId: string;
  academicYearId: string;
}): Promise<TeacherDirectoryData> {
  const [{ data: classSubjectsData, error: classSubjectsError }, assignments] =
    await Promise.all([
      supabase
        .from("class_subjects")
        .select("id, class_id, subject_id, academic_year_id, coefficient")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId),
      loadTeacherAssignmentsForAcademicYear(academicYearId, schoolId),
    ]);

  if (classSubjectsError) throw classSubjectsError;

  return {
    assignments,
    classSubjects: (classSubjectsData ?? []) as TeacherDirectoryClassSubject[],
  };
}

export function indexClassSubjectsById(
  classSubjects: TeacherDirectoryClassSubject[]
): Map<string, TeacherDirectoryClassSubject> {
  return new Map(classSubjects.map((item) => [item.id, item]));
}
