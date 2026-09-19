/**
 * Students — single source of truth (PRD).
 * Always filtered by school_id of the connected user.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentRow = {
  id: string;
  school_id: string;
  first_name: string | null;
  last_name: string | null;
  matricule: string | null;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type StudentCreateInput = {
  school_id: string;
  first_name: string;
  last_name: string;
  matricule?: string;
  gender?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
};

const STUDENT_SELECT =
  "id, school_id, first_name, last_name, matricule, gender, date_of_birth, phone, email, is_active, created_at";

export async function fetchStudentsForSchool(
  supabase: SupabaseClient,
  schoolId: string
): Promise<{ data: StudentRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT)
    .eq("school_id", schoolId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    const fallback = await supabase
      .from("students")
      .select("id, school_id, first_name, last_name, created_at")
      .eq("school_id", schoolId)
      .order("last_name", { ascending: true });

    if (fallback.error) {
      return { data: [], error: error.message };
    }

    return {
      data: (fallback.data || []).map((r) => ({
        id: r.id,
        school_id: r.school_id,
        first_name: r.first_name,
        last_name: r.last_name,
        matricule: null,
        gender: null,
        date_of_birth: null,
        phone: null,
        email: null,
        is_active: null,
        created_at: r.created_at ?? null,
      })),
      error: null,
    };
  }

  return { data: (data as StudentRow[]) || [], error: null };
}

export async function createStudent(
  supabase: SupabaseClient,
  input: StudentCreateInput
): Promise<{ data: StudentRow | null; error: string | null }> {
  const payload: Record<string, unknown> = {
    school_id: input.school_id,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    is_active: true,
  };

  if (input.matricule?.trim()) payload.matricule = input.matricule.trim();
  if (input.gender?.trim()) payload.gender = input.gender.trim();
  if (input.date_of_birth?.trim()) payload.date_of_birth = input.date_of_birth.trim();
  if (input.phone?.trim()) payload.phone = input.phone.trim();
  if (input.email?.trim()) payload.email = input.email.trim();

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select(STUDENT_SELECT)
    .single();

  if (error) {
    // Minimal insert if optional columns missing
    const minimal = await supabase
      .from("students")
      .insert({
        school_id: input.school_id,
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
      })
      .select("id, school_id, first_name, last_name, created_at")
      .single();

    if (minimal.error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: minimal.data.id,
        school_id: minimal.data.school_id,
        first_name: minimal.data.first_name,
        last_name: minimal.data.last_name,
        matricule: null,
        gender: null,
        date_of_birth: null,
        phone: null,
        email: null,
        is_active: true,
        created_at: minimal.data.created_at ?? null,
      },
      error: null,
    };
  }

  return { data: data as StudentRow, error: null };
}

export function studentDisplayName(s: StudentRow): string {
  const name = [s.last_name, s.first_name].filter(Boolean).join(" ");
  return name || s.matricule || s.id.slice(0, 8);
}
