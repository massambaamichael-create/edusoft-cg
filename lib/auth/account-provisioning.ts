import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ProvisionedAuthAccount = {
  authUserId: string;
  loginIdentifier: string;
  temporaryPassword: string;
};

/**
 * Central Identity & Access provisioning primitive.
 *
 * Rules:
 * - Supabase Auth owns authentication/passwords.
 * - public.users owns school/role/identity linkage.
 * - Business profiles (teacher, student, parent, staff...) remain in their
 *   existing tables and are never duplicated here.
 * - The temporary password is returned only to the caller responsible for
 *   secure delivery; it is never persisted in a business table.
 */
export async function provisionAuthAccount(params: {
  email: string;
  schoolId: string;
  roleName: string;
  loginIdentifier?: string;
}) : Promise<ProvisionedAuthAccount> {
  const authEmail = params.email.trim().toLowerCase();
  const loginIdentifier = (params.loginIdentifier ?? authEmail).trim().toLowerCase();

  if (!loginIdentifier) {
    throw new Error("Un identifiant de connexion est requis.");
  }

  const temporaryPassword = crypto.randomBytes(12).toString("base64url");

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: authEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      school_id: params.schoolId,
      role_name: params.roleName,
      identity_provisioned: true,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Impossible de créer le compte Auth.");
  }

  return {
    authUserId: data.user.id,
    loginIdentifier,
    temporaryPassword,
  };
}
