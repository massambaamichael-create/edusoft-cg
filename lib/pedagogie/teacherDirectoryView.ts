import type { TeacherAssignment } from "@/lib/pedagogie/teacherAssignments";
import type { TeacherDirectoryClassSubject } from "@/lib/pedagogie/teacherDirectory";

export type TeacherDirectoryCycle = {
  id: string;
  school_id: string | null;
  name: string;
};

export type TeacherDirectorySubject = {
  id: string;
  school_id: string | null;
  name: string;
  coefficient: number | null;
};

export type TeacherDirectoryClass = {
  id: string;
  school_id: string | null;
  cycle_id: string | null;
  level_id: string | null;
  series_id: string | null;
  academic_year_id: string | null;
  name: string;
  principal_teacher_id: string | null;
};

export type TeacherDirectoryAssignmentView = {
  assignment: TeacherAssignment;
  classSubject: TeacherDirectoryClassSubject | null;
  schoolClass: TeacherDirectoryClass | null;
  cycle: TeacherDirectoryCycle | null;
  subject: TeacherDirectorySubject | null;
};

export function buildTeacherDirectoryAssignmentViews({
  teacherId,
  assignments,
  classSubjects,
  classes,
  cycles,
  subjects,
}: {
  teacherId: string;
  assignments: TeacherAssignment[];
  classSubjects: TeacherDirectoryClassSubject[];
  classes: TeacherDirectoryClass[];
  cycles: TeacherDirectoryCycle[];
  subjects: TeacherDirectorySubject[];
}): TeacherDirectoryAssignmentView[] {
  const classSubjectById = new Map(
    classSubjects.map((classSubject) => [classSubject.id, classSubject])
  );
  const classById = new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass]));
  const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  return assignments
    .filter((assignment) => assignment.teacher_id === teacherId)
    .map((assignment) => {
      const classSubject = classSubjectById.get(assignment.class_subject_id) ?? null;
      const schoolClass = classSubject
        ? classById.get(classSubject.class_id) ?? null
        : null;

      return {
        assignment,
        classSubject,
        schoolClass,
        cycle: schoolClass?.cycle_id
          ? cycleById.get(schoolClass.cycle_id) ?? null
          : null,
        subject: classSubject
          ? subjectById.get(classSubject.subject_id) ?? null
          : null,
      };
    });
}
