/**
 * Server/browser helpers that wrap EduSoft CG Supabase security functions.
 *
 * These map to existing DB functions:
 * - get_my_school_id()
 * - get_my_role()
 * - get_my_permissions()
 * - has_permission(permission_code)
 * - is_my_class_subject(target_class_subject_id)
 *
 * Prefer the React hook `useCurrentUser` in Client Components.
 * Use these functions in Route Handlers / Server Components when needed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PermissionCode, RoleName } from "./types";

type RpcClient = SupabaseClient;

export async function fetchMySchoolId(
  supabase: RpcClient
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_my_school_id");
  if (error) {
    console.error("[auth] get_my_school_id:", error.message);
    return null;
  }
  return (data as string | null) ?? null;
}

export async function fetchMyRole(
  supabase: RpcClient
): Promise<RoleName | null> {
  const { data, error } = await supabase.rpc("get_my_role");
  if (error) {
    console.error("[auth] get_my_role:", error.message);
    return null;
  }
  return (data as string | null) ?? null;
}

export async function fetchMyPermissions(
  supabase: RpcClient
): Promise<PermissionCode[]> {
  const { data, error } = await supabase.rpc("get_my_permissions");
  if (error) {
    console.error("[auth] get_my_permissions:", error.message);
    return [];
  }
  // RPC may return text[] or jsonb array
  if (Array.isArray(data)) {
    return data as PermissionCode[];
  }
  return [];
}

export async function checkPermission(
  supabase: RpcClient,
  permissionCode: PermissionCode
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_permission", {
    permission_code: permissionCode,
  });
  if (error) {
    console.error("[auth] has_permission:", error.message);
    return false;
  }
  return data === true;
}

export async function checkIsMyClassSubject(
  supabase: RpcClient,
  classSubjectId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_my_class_subject", {
    target_class_subject_id: classSubjectId,
  });
  if (error) {
    console.error("[auth] is_my_class_subject:", error.message);
    return false;
  }
  return data === true;
}

/**
 * Resolve a role UUID by name (avoids hardcoding role IDs).
 * Uses service role or authenticated client depending on caller.
 */
export async function resolveRoleIdByName(
  supabase: RpcClient,
  roleName: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[auth] resolveRoleIdByName:", error.message);
    return null;
  }
  return data?.id ?? null;
}
