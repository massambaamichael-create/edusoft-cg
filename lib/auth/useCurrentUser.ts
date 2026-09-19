"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  CurrentUserContext,
  PermissionCode,
  RoleName,
  School,
  UserProfile,
} from "./types";
import {
  fetchMyPermissions,
  fetchMyRole,
} from "./permissions";

const emptyPermissions: PermissionCode[] = [];

/**
 * Central hook for EduSoft CG identity context.
 *
 * Loads:
 * - users profile (school_id, role_id, names…)
 * - schools row (name, code…)
 * - role name via get_my_role()
 * - permission list via get_my_permissions()
 *
 * Use this instead of scattering role checks and school_id reads.
 */
export function useCurrentUser(): CurrentUserContext {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [permissions, setPermissions] =
    useState<PermissionCode[]>(emptyPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        setProfile(null);
        setSchool(null);
        setRole(null);
        setPermissions(emptyPermissions);
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("users")
        .select(
          "id, auth_user_id, school_id, role_id, first_name, last_name, email, phone, is_active"
        )
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileRow) {
        setProfile(null);
        setSchool(null);
        setRole(null);
        setPermissions(emptyPermissions);
        setError("Profil EduSoft introuvable.");
        return;
      }

      const typedProfile = profileRow as UserProfile;
      setProfile(typedProfile);

      // School (optional if table/row missing)
      if (typedProfile.school_id) {
        const { data: schoolRow, error: schoolError } = await supabase
          .from("schools")
          .select(
            "id, name, code, email, phone, city, country, logo_url"
          )
          .eq("id", typedProfile.school_id)
          .maybeSingle();

        if (schoolError) {
          console.warn("[useCurrentUser] schools:", schoolError.message);
          setSchool(null);
        } else {
          setSchool((schoolRow as School | null) ?? null);
        }
      } else {
        setSchool(null);
      }

      // Role + permissions via RPC (source of truth)
      const [roleName, perms] = await Promise.all([
        fetchMyRole(supabase),
        fetchMyPermissions(supabase),
      ]);

      setRole(roleName);
      setPermissions(perms);
    } catch (err) {
      console.error("[useCurrentUser]", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le contexte utilisateur."
      );
      setProfile(null);
      setSchool(null);
      setRole(null);
      setPermissions(emptyPermissions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasPermission = useCallback(
    (code: PermissionCode) => permissions.includes(code),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...codes: PermissionCode[]) =>
      codes.some((code) => permissions.includes(code)),
    [permissions]
  );

  const isRole = useCallback(
    (name: RoleName) => role === name,
    [role]
  );

  return {
    profile,
    school,
    role,
    permissions,
    schoolId: profile?.school_id ?? school?.id ?? null,
    loading,
    error,
    isAuthenticated: !!profile,
    hasPermission,
    hasAnyPermission,
    isRole,
    refresh: load,
  };
}
