/*
 * EduSoft CG — Classes architecture
 * Canonical pedagogical model used by the Classes page.
 *
 * IMPORTANT:
 * - class_subjects defines the subjects configured for a class/year.
 * - teacher_assignments defines which teacher teaches each class_subject.
 * - teacher_subjects is intentionally not part of this architecture.
 * - Lycée général and Lycée technique are distinct pedagogical contexts.
 */

export type SchoolTrack = "Primaire" | "Collège" | "Lycée général" | "Lycée technique";

export type ClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  coefficient: number;
  created_at: string;
};

export type TeacherAssignment = {
  id: string;
  school_id: string;
  teacher_id: string;
  class_subject_id: string;
  academic_year_id: string;
  status: "active" | "inactive";
  is_primary_teacher: boolean;
  created_at?: string;
};

export type PedagogicalClass = {
  id: string;
  school_id: string;
  cycle_id: string;
  level_id: string | null;
  series_id: string | null;
  academic_year_id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  principal_teacher_id: string | null;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
};

export function normalizeCycleName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Determines the pedagogical track without ever merging the two lycée tracks.
 * Series.category is preferred when available, then series.name as fallback.
 */
export function resolveSchoolTrack(params: {
  cycleName?: string | null;
  seriesName?: string | null;
  seriesCategory?: string | null;
}): SchoolTrack | null {
  const cycle = normalizeCycleName(params.cycleName);

  if (cycle === "primaire") return "Primaire";
  if (cycle === "college") return "Collège";

  if (cycle === "lycee") {
    const category = normalizeCycleName(params.seriesCategory);
    const series = normalizeCycleName(params.seriesName);

    if (category.includes("technique") || series.includes("technique")) {
      return "Lycée technique";
    }

    return "Lycée général";
  }

  return null;
}

export function isLycéeGeneral(track: SchoolTrack | null): boolean {
  return track === "Lycée général";
}

export function isLycéeTechnique(track: SchoolTrack | null): boolean {
  return track === "Lycée technique";
}

export function getAssignmentForClassSubject(
  assignments: TeacherAssignment[],
  classSubjectId: string,
  academicYearId: string
): TeacherAssignment | null {
  return (
    assignments.find(
      (assignment) =>
        assignment.class_subject_id === classSubjectId &&
        assignment.academic_year_id === academicYearId &&
        assignment.status === "active"
    ) ?? null
  );
}
