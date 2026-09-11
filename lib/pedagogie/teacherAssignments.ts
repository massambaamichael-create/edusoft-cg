import { supabase } from "@/lib/supabase";

export type TeacherAssignment = {
  id: string;
  school_id: string;
  teacher_id: string;
  class_subject_id: string;
  academic_year_id: string;
  status: string;
  is_primary_teacher: boolean;
};

const TEACHER_ASSIGNMENT_SELECT =
  "id, school_id, teacher_id, class_subject_id, academic_year_id, status, is_primary_teacher";

export async function loadTeacherAssignmentsForClass(
  classSubjectIds: string[],
  academicYearId: string
): Promise<TeacherAssignment[]> {
  if (classSubjectIds.length === 0) return [];

  const { data, error } = await supabase
    .from("teacher_assignments")
    .select(TEACHER_ASSIGNMENT_SELECT)
    .eq("academic_year_id", academicYearId)
    .in("class_subject_id", classSubjectIds);

  if (error) throw error;
  return (data ?? []) as TeacherAssignment[];
}

export async function loadTeacherAssignmentsForAcademicYear(
  academicYearId: string,
  schoolId: string
): Promise<TeacherAssignment[]> {
  const { data, error } = await supabase
    .from("teacher_assignments")
    .select(TEACHER_ASSIGNMENT_SELECT)
    .eq("academic_year_id", academicYearId)
    .eq("school_id", schoolId);

  if (error) throw error;
  return (data ?? []) as TeacherAssignment[];
}

export async function saveTeacherAssignment({
  assignment,
  teacherId,
  schoolId,
  academicYearId,
  classSubjectId,
  isPrimaryTeacher = false,
}: {
  assignment?: TeacherAssignment | null;
  teacherId: string;
  schoolId: string;
  academicYearId: string;
  classSubjectId: string;
  isPrimaryTeacher?: boolean;
}): Promise<TeacherAssignment> {
  if (assignment) {
    const { data, error } = await supabase
      .from("teacher_assignments")
      .update({
        teacher_id: teacherId,
        is_primary_teacher: isPrimaryTeacher,
      })
      .eq("id", assignment.id)
      .select(TEACHER_ASSIGNMENT_SELECT)
      .single();

    if (error) throw error;
    return data as TeacherAssignment;
  }

  const { data, error } = await supabase
    .from("teacher_assignments")
    .insert({
      teacher_id: teacherId,
      class_subject_id: classSubjectId,
      academic_year_id: academicYearId,
      school_id: schoolId,
      status: "active",
      is_primary_teacher: isPrimaryTeacher,
    })
    .select(TEACHER_ASSIGNMENT_SELECT)
    .single();

  if (error) throw error;
  return data as TeacherAssignment;
}
