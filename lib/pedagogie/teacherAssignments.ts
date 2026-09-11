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

export async function loadTeacherAssignmentsForClass(
  classSubjectIds: string[],
  academicYearId: string
): Promise<TeacherAssignment[]> {
  if (classSubjectIds.length === 0) return [];

  const { data, error } = await supabase
    .from("teacher_assignments")
    .select(
      "id, school_id, teacher_id, class_subject_id, academic_year_id, status, is_primary_teacher"
    )
    .eq("academic_year_id", academicYearId)
    .in("class_subject_id", classSubjectIds);

  if (error) throw error;
  return (data ?? []) as TeacherAssignment[];
}

export async function saveTeacherAssignment({
  assignment,
  teacherId,
  schoolId,
  academicYearId,
  classSubjectId,
}: {
  assignment?: TeacherAssignment | null;
  teacherId: string;
  schoolId: string;
  academicYearId: string;
  classSubjectId: string;
}): Promise<TeacherAssignment> {
  if (assignment) {
    const { data, error } = await supabase
      .from("teacher_assignments")
      .update({ teacher_id: teacherId })
      .eq("id", assignment.id)
      .select(
        "id, school_id, teacher_id, class_subject_id, academic_year_id, status, is_primary_teacher"
      )
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
      is_primary_teacher: false,
    })
    .select(
      "id, school_id, teacher_id, class_subject_id, academic_year_id, status, is_primary_teacher"
    )
    .single();

  if (error) throw error;
  return data as TeacherAssignment;
}
