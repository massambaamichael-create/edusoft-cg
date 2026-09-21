/**
 * Load the logged-in teacher's pedagogical scope.
 * Prefers teacher_assignments → class_subjects → classes.
 * Falls back to legacy teacher_subjects if needed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type TeacherAssignmentQueryRow = {
  id: string;
  academic_year_id: string | null;
  class_subject_id: string | null;
  class_subjects?: {
    id: string;
    class_id: string;
    subject_id: string;
    academic_year_id: string | null;
    classes?: { id: string; name: string | null; academic_year_id: string | null } | null;
    subjects?: { id: string; name: string | null } | null;
    academic_years?: { id: string; name: string | null } | null;
  } | null;
};

type LegacyTeacherSubjectRow = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string | null;
  classes?: { id: string; name: string | null } | null;
  subjects?: { id: string; name: string | null } | null;
  academic_years?: { id: string; name: string | null } | null;
};

export type TeacherClassRow = {
  classId: string;
  className: string;
  academicYearId: string | null;
  academicYearName: string | null;
  subjects: { id: string; name: string; classSubjectId: string | null }[];
};

async function resolveTeacherId(
  supabase: SupabaseClient,
  userProfileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", userProfileId)
    .maybeSingle();

  if (error) {
    console.error("[assignments] teachers:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchTeacherClasses(
  supabase: SupabaseClient,
  userProfileId: string
): Promise<{ classes: TeacherClassRow[]; source: string; error: string | null }> {
  const teacherId = await resolveTeacherId(supabase, userProfileId);
  if (!teacherId) {
    return {
      classes: [],
      source: "none",
      error: "Profil enseignant introuvable.",
    };
  }

  // --- Preferred: teacher_assignments ---
  const modern = await supabase
    .from("teacher_assignments")
    .select(
      `
      id,
      academic_year_id,
      class_subject_id,
      class_subjects (
        id,
        class_id,
        subject_id,
        academic_year_id,
        classes ( id, name, academic_year_id ),
        subjects ( id, name ),
        academic_years ( id, name )
      )
    `
    )
    .eq("teacher_id", teacherId);

  if (!modern.error && modern.data && modern.data.length > 0) {
    const map = new Map<string, TeacherClassRow>();

    for (const row of modern.data as TeacherAssignmentQueryRow[]) {
      const cs = row.class_subjects;
      if (!cs) continue;
      const cls = cs.classes;
      const sub = cs.subjects;
      const year = cs.academic_years;
      if (!cls?.id) continue;

      const existing = map.get(cls.id);
      const subjectEntry = sub
        ? {
            id: sub.id as string,
            name: (sub.name as string) || "Matière",
            classSubjectId: (cs.id as string) || null,
          }
        : null;

      if (existing) {
        if (
          subjectEntry &&
          !existing.subjects.some((s) => s.id === subjectEntry.id)
        ) {
          existing.subjects.push(subjectEntry);
        }
      } else {
        map.set(cls.id, {
          classId: cls.id,
          className: cls.name || "Classe",
          academicYearId: row.academic_year_id || cs.academic_year_id || null,
          academicYearName: year?.name || null,
          subjects: subjectEntry ? [subjectEntry] : [],
        });
      }
    }

    return {
      classes: Array.from(map.values()).sort((a, b) =>
        a.className.localeCompare(b.className, "fr")
      ),
      source: "teacher_assignments",
      error: null,
    };
  }

  // --- Fallback: legacy teacher_subjects ---
  const legacy = await supabase
    .from("teacher_subjects")
    .select(
      `
      id,
      class_id,
      subject_id,
      academic_year_id,
      classes ( id, name ),
      subjects ( id, name ),
      academic_years ( id, name )
    `
    )
    .eq("teacher_id", teacherId);

  if (legacy.error) {
    return {
      classes: [],
      source: "error",
      error:
        modern.error?.message ||
        legacy.error.message ||
        "Impossible de charger les affectations.",
    };
  }

  const map = new Map<string, TeacherClassRow>();
  for (const row of (legacy.data || []) as LegacyTeacherSubjectRow[]) {
    const cls = row.classes;
    const sub = row.subjects;
    if (!cls?.id) continue;

    const existing = map.get(cls.id);
    const subjectEntry = sub
      ? {
          id: sub.id as string,
          name: (sub.name as string) || "Matière",
          classSubjectId: null,
        }
      : null;

    if (existing) {
      if (
        subjectEntry &&
        !existing.subjects.some((s) => s.id === subjectEntry.id)
      ) {
        existing.subjects.push(subjectEntry);
      }
    } else {
      map.set(cls.id, {
        classId: cls.id,
        className: cls.name || "Classe",
        academicYearId: row.academic_year_id || null,
        academicYearName: row.academic_years?.name || null,
        subjects: subjectEntry ? [subjectEntry] : [],
      });
    }
  }

  return {
    classes: Array.from(map.values()).sort((a, b) =>
      a.className.localeCompare(b.className, "fr")
    ),
    source: "teacher_subjects",
    error: null,
  };
}
