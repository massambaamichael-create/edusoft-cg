/**
 * Parents / tuteurs — single source of truth (PRD).
 * Linked to students via student_parents (many-to-many).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ParentRow = {
  id: string;
  school_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  created_at: string | null;
};

export type StudentParentLink = {
  parent_id: string;
  student_id: string;
  relationship: string | null;
};

export type ParentCreateInput = {
  school_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
};

export async function fetchParentsForSchool(
  supabase: SupabaseClient,
  schoolId: string
): Promise<{ data: ParentRow[]; error: string | null }> {
  const full = await supabase
    .from("parents")
    .select(
      "id, school_id, first_name, last_name, phone, email, relationship, created_at"
    )
    .eq("school_id", schoolId)
    .order("last_name", { ascending: true });

  if (!full.error) {
    return { data: (full.data as ParentRow[]) || [], error: null };
  }

  const minimal = await supabase
    .from("parents")
    .select("id, school_id, first_name, last_name, phone, email, created_at")
    .eq("school_id", schoolId)
    .order("last_name", { ascending: true });

  if (minimal.error) {
    return { data: [], error: full.error.message };
  }

  return {
    data: (minimal.data || []).map((r) => ({
      ...(r as Omit<ParentRow, "relationship">),
      relationship: null,
    })),
    error: null,
  };
}

export async function fetchStudentParentLinks(
  supabase: SupabaseClient,
  schoolId: string
): Promise<{ data: StudentParentLink[]; error: string | null }> {
  const { data, error } = await supabase
    .from("student_parents")
    .select("parent_id, student_id, relationship");

  if (error) {
    const fallback = await supabase
      .from("student_parents")
      .select("parent_id, student_id");

    if (fallback.error) {
      return { data: [], error: error.message };
    }

    return {
      data: (fallback.data || []).map((r) => ({
        parent_id: r.parent_id,
        student_id: r.student_id,
        relationship: null,
      })),
      error: null,
    };
  }

  void schoolId;
  return { data: (data as StudentParentLink[]) || [], error: null };
}

export async function createParent(
  supabase: SupabaseClient,
  input: ParentCreateInput
): Promise<{ data: ParentRow | null; error: string | null }> {
  const payload: Record<string, unknown> = {
    school_id: input.school_id,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
  };
  if (input.phone?.trim()) payload.phone = input.phone.trim();
  if (input.email?.trim()) payload.email = input.email.trim();

  const { data, error } = await supabase
    .from("parents")
    .insert(payload)
    .select("id, school_id, first_name, last_name, phone, email, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: {
      ...(data as Omit<ParentRow, "relationship">),
      relationship: null,
    },
    error: null,
  };
}

/** Link one parent to one student (many-to-many, PRD). */
export async function linkStudentParent(
  supabase: SupabaseClient,
  studentId: string,
  parentId: string,
  relationship?: string
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    student_id: studentId,
    parent_id: parentId,
  };
  if (relationship?.trim()) payload.relationship = relationship.trim();

  const { error } = await supabase.from("student_parents").insert(payload);

  if (error) {
    // Retry without relationship column
    const retry = await supabase.from("student_parents").insert({
      student_id: studentId,
      parent_id: parentId,
    });
    if (retry.error) return { error: error.message };
  }

  return { error: null };
}

export function parentDisplayName(p: ParentRow): string {
  const name = [p.last_name, p.first_name].filter(Boolean).join(" ");
  return name || p.phone || p.email || p.id.slice(0, 8);
}
