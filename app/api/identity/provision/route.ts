import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { provisionAuthAccount } from "@/lib/auth/account-provisioning";
import { resolveRoleIdByName } from "@/lib/auth/permissions";
import { resend } from "@/lib/resend";

const ALLOWED_ROLES = new Set(["Directeur", "Administrateur", "Secrétaire"]);

type EntityType = "parent" | "student";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getAuthorizedUser(request: Request) {
  const accessToken = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return { error: NextResponse.json({ success: false, error: "Authentification requise." }, { status: 401 }) };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !authUser) {
    return { error: NextResponse.json({ success: false, error: "Session invalide ou expirée." }, { status: 401 }) };
  }

  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("id, school_id, is_active, roles(name)")
    .eq("auth_user_id", authUser.id)
    .single();

  if (error || !profile || profile.is_active === false) {
    return { error: NextResponse.json({ success: false, error: "Compte non autorisé." }, { status: 403 }) };
  }

  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  const roleName = (role as { name?: string } | null)?.name ?? null;

  if (!ALLOWED_ROLES.has(roleName ?? "")) {
    return { error: NextResponse.json({ success: false, error: "Vous n'avez pas l'autorisation de générer des identifiants." }, { status: 403 }) };
  }

  return { profile: { id: profile.id, school_id: profile.school_id, roleName } };
}

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;
  let createdProfileId: string | null = null;
  let createdBusinessId: string | null = null;
  let createdBusinessTable: EntityType | null = null;

  try {
    const auth = await getAuthorizedUser(request);
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const entity = normalize(body?.entity) as EntityType;
    const entityId = normalize(body?.entity_id);

    if (!["parent", "student"].includes(entity) || !entityId) {
      return NextResponse.json(
        { success: false, error: "Type de profil ou identifiant de profil invalide." },
        { status: 400 }
      );
    }

    const roleName = entity === "parent" ? "Parent" : "Élève";
    const table = entity === "parent" ? "parents" : "students";
    const permission = entity === "parent" ? "parents.manage" : "students.create";

    const roleId = await resolveRoleIdByName(supabaseAdmin, roleName);
    if (!roleId) {
      return NextResponse.json(
        { success: false, error: `Le rôle ${roleName} est introuvable en base.` },
        { status: 500 }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("id", entityId)
      .eq("school_id", auth.profile.school_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: "Profil métier introuvable dans votre établissement." },
        { status: 404 }
      );
    }

    if (business.user_id) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id, login_identifier, email, is_active")
        .eq("id", business.user_id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        alreadyProvisioned: true,
        identifier: existingUser?.login_identifier ?? existingUser?.email ?? null,
        user: existingUser ?? null,
        message: "Ce profil possède déjà un accès.",
      });
    }

    const { data: permissionRow } = await supabaseAdmin
      .from("permissions")
      .select("id")
      .eq("code", permission)
      .maybeSingle();

    const { data: rolePermission } = permissionRow
      ? await supabaseAdmin
          .from("role_permissions")
          .select("id")
          .eq("school_id", auth.profile.school_id)
          .eq("role_id", await resolveRoleIdByName(supabaseAdmin, auth.profile.roleName ?? ""))
          .eq("permission_id", permissionRow.id)
          .eq("granted", true)
          .maybeSingle()
      : { data: null };

    if (auth.profile.roleName !== "Directeur" && !rolePermission) {
      return NextResponse.json(
        { success: false, error: "Votre rôle ne dispose pas de la permission nécessaire." },
        { status: 403 }
      );
    }

    const school = (await supabaseAdmin
      .from("schools")
      .select("code")
      .eq("id", auth.profile.school_id)
      .single()).data;

    const schoolCode = normalize(school?.code).toUpperCase() || "EDCG";
    const rawMatricule = normalize(business.registration_number ?? business.matricule);

    const identifier =
      entity === "parent"
        ? normalize(business.email) || `${schoolCode}-PAR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
        : rawMatricule
          ? `${schoolCode}-${rawMatricule}`
          : `${schoolCode}-ELV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const normalizedIdentifier = identifier.toLowerCase();

    const { data: existingIdentifier } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("login_identifier", normalizedIdentifier)
      .maybeSingle();

    if (existingIdentifier) {
      return NextResponse.json(
        { success: false, error: "Cet identifiant de connexion est déjà utilisé." },
        { status: 409 }
      );
    }

    const contactEmail = normalize(business.email).toLowerCase();
    const authEmail =
      contactEmail ||
      `${normalizedIdentifier.replace(/[^a-z0-9._-]/g, "-")}@login.edusoft.cg`;

    const provisioned = await provisionAuthAccount({
      email: authEmail,
      loginIdentifier: normalizedIdentifier,
      schoolId: auth.profile.school_id,
      roleName,
    });

    createdAuthUserId = provisioned.authUserId;

    const firstName = normalize(business.first_name);
    const lastName = normalize(business.last_name);

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_user_id: provisioned.authUserId,
        school_id: auth.profile.school_id,
        role_id: roleId,
        first_name: firstName,
        last_name: lastName,
        email: contactEmail || authEmail,
        login_identifier: normalizedIdentifier,
        phone: business.phone ?? null,
        is_active: true,
        must_change_password: true,
      })
      .select("id, auth_user_id, school_id, role_id, first_name, last_name, email, login_identifier, is_active, must_change_password")
      .single();

    if (userError || !userData) {
      await supabaseAdmin.auth.admin.deleteUser(provisioned.authUserId);
      createdAuthUserId = null;
      return NextResponse.json(
        { success: false, error: userError?.message ?? "Impossible de créer le profil d'accès." },
        { status: 500 }
      );
    }

    createdProfileId = userData.id;

    const { error: linkError } = await supabaseAdmin
      .from(table)
      .update({ user_id: userData.id })
      .eq("id", entityId)
      .eq("school_id", auth.profile.school_id);

    if (linkError) {
      await supabaseAdmin.from("users").delete().eq("id", userData.id);
      await supabaseAdmin.auth.admin.deleteUser(provisioned.authUserId);
      createdAuthUserId = null;
      createdProfileId = null;
      return NextResponse.json(
        { success: false, error: linkError.message },
        { status: 500 }
      );
    }

    createdBusinessId = entityId;
    createdBusinessTable = entity;

    if (contactEmail && !contactEmail.endsWith("@login.edusoft.cg")) {
      const { error: emailError } = await resend.emails.send({
        from: "EduSoft CG <onboarding@resend.dev>",
        to: [contactEmail],
        subject: "Vos identifiants EduSoft CG",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h1>EduSoft CG</h1>
            <p>Bonjour ${escapeHtml(firstName)},</p>
            <p>Votre accès ${entity === "parent" ? "parent" : "élève"} a été créé par votre établissement.</p>
            <p><strong>Identifiant :</strong> ${escapeHtml(normalizedIdentifier)}</p>
            <p><strong>Mot de passe temporaire :</strong> ${escapeHtml(provisioned.temporaryPassword)}</p>
            <p>Lors de votre première connexion, le changement du mot de passe est obligatoire.</p>
          </div>
        `,
      });

      if (emailError) {
        console.error("ERREUR ENVOI IDENTIFIANTS :", emailError);
        await supabaseAdmin.from(table).update({ user_id: null }).eq("id", entityId);
        await supabaseAdmin.from("users").delete().eq("id", userData.id);
        await supabaseAdmin.auth.admin.deleteUser(provisioned.authUserId);
        createdAuthUserId = null;
        createdProfileId = null;
        return NextResponse.json(
          { success: false, error: "Le compte a été annulé car les identifiants n'ont pas pu être transmis." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      alreadyProvisioned: false,
      identifier: normalizedIdentifier,
      temporaryPassword: provisioned.temporaryPassword,
      delivery: contactEmail ? "email" : "admin",
      message: contactEmail
        ? "Accès créé et identifiants transmis."
        : "Accès créé. Les identifiants doivent être transmis par l'établissement.",
    }, { status: 201 });
  } catch (error) {
    console.error("ERREUR PROVISIONING PORTAIL :", error);

    if (createdBusinessId && createdBusinessTable) {
      await supabaseAdmin
        .from(createdBusinessTable)
        .update({ user_id: null })
        .eq("id", createdBusinessId);
    }
    if (createdProfileId) {
      await supabaseAdmin.from("users").delete().eq("id", createdProfileId);
    }
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }

    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la génération des identifiants." },
      { status: 500 }
    );
  }
}
