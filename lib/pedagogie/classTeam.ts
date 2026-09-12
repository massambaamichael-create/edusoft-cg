import { supabase } from "@/lib/supabase";
import {
  loadTeacherAssignmentsForClass,
  type TeacherAssignment,
} from "@/lib/pedagogie/teacherAssignments";

export type ClassTeamSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  coefficient: number;
  created_at: string;
};

export type ClassTeamData = {
  classSubjects: ClassTeamSubject[];
  teacherAssignments: TeacherAssignment[];
};

export async function loadClassTeamData({
  classId,
  academicYearId,
}: {
  classId: string;
  academicYearId: string;
}): Promise<ClassTeamData> {
  const { data: classSubjectsData, error: classSubjectsError } = await supabase
    .from("class_subjects")
    .select("*")
    .eq("class_id", classId)
    .eq("academic_year_id", academicYearId);

  if (classSubjectsError) throw classSubjectsError;

  const classSubjects = (classSubjectsData ?? []) as ClassTeamSubject[];
  const classSubjectIds = classSubjects.map((item) => item.id);

  const teacherAssignments = await loadTeacherAssignmentsForClass(
    classSubjectIds,
    academicYearId
  );

  return {
    classSubjects,
    teacherAssignments,
  };
}
