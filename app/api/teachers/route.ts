import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";
import { resolveRoleIdByName } from "@/lib/auth/permissions";
import { provisionAuthAccount } from "@/lib/auth/account-provisioning";

const ALLOWED_CREATOR_ROLES = new Set(["Directeur"]);

type AuthorizedUser = {
  id: string;
  auth_user_id: string;
  school_id: string;
  role_name: string | null;
};

async function getAuthorizedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return {
      user: null as AuthorizedUser | null,
      response: NextResponse.json(
        { success: false, error: "Authentification requise." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !authUser) {
    return {
      user: null as AuthorizedUser | null,
      response: NextResponse.json(
        { success: false, error: "Session invalide ou expirée." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id, school_id, roles(name)")
    .eq("auth_user_id", authUser.id)
    .single();

  if (profileError || !profile) {
    console.error("ERREUR PROFIL API TEACHERS :", profileError);
    return {
      user: null as AuthorizedUser | null,
      response: NextResponse.json(
        { success: false, error: "Profil utilisateur introuvable." },
        { status: 403 }
      ),
    };
  }

  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  const authorizedUser: AuthorizedUser = {
    id: profile.id,
    auth_user_id: profile.auth_user_id,
    school_id: profile.school_id,
    role_name: (role as { name?: string } | null)?.name ?? null,
  };

  if (!authorizedUser.school_id) {
    return {
      user: null as AuthorizedUser | null,
      response: NextResponse.json(
        { success: false, error: "Aucune école n'est associée à ce compte." },
        { status: 403 }
      ),
    };
  }

  return { user: authorizedUser, response: null };
}

export async function GET(request: Request) {
  try {
    const { user, response } = await getAuthorizedUser(request);

    if (response) return response;

    if (!user || !ALLOWED_CREATOR_ROLES.has(user.role_name ?? "")) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("school_id", user.school_id)
      .limit(1);

    if (error) {
      console.error("ERREUR API TEACHERS :", error);

      return NextResponse.json(
        { success: false, error: "Impossible de récupérer les enseignants." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERREUR API TEACHERS GET :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;
  let createdProfileId: string | null = null;

  try {
    const { user, response } = await getAuthorizedUser(request);

    if (response) return response;

    if (!user || !ALLOWED_CREATOR_ROLES.has(user.role_name ?? "")) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous n'avez pas l'autorisation de créer un enseignant.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      school_id: requestedSchoolId,
      employee_number,
    } = body;

    if (requestedSchoolId && requestedSchoolId !== user.school_id) {
      return NextResponse.json(
        { success: false, error: "Accès à cette école non autorisé." },
        { status: 403 }
      );
    }

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Prénom, nom et email sont obligatoires.",
        },
        { status: 400 }
      );
    }

    const teacherRoleId = await resolveRoleIdByName(supabaseAdmin, "Enseignant");

    if (!teacherRoleId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le rôle Enseignant est introuvable en base. Vérifiez la table roles.",
        },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    let provisionedAccount;
    try {
      provisionedAccount = await provisionAuthAccount({
        email: normalizedEmail,
        schoolId: user.school_id,
        roleName: "Enseignant",
      });
    } catch (authError) {
      console.error("ERREUR PROVISIONING AUTH :", authError);

      return NextResponse.json(
        {
          success: false,
          error:
            authError instanceof Error
              ? authError.message
              : "Impossible de créer le compte.",
        },
        { status: 500 }
      );
    }

    const temporaryPassword = provisionedAccount.temporaryPassword;
    createdAuthUserId = provisionedAccount.authUserId;

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_user_id: createdAuthUserId,
        school_id: user.school_id,
        role_id: teacherRoleId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        is_active: true,
        must_change_password: true,
      })
      .select("*")
      .single();

    if (userError || !userData) {
      console.error("ERREUR CRÉATION USERS :", userError);
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      createdAuthUserId = null;

      return NextResponse.json(
        {
          success: false,
          error:
            userError?.message ?? "Impossible de créer le profil utilisateur.",
        },
        { status: 500 }
      );
    }

    createdProfileId = userData.id;

    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .insert({
        school_id: user.school_id,
        user_id: userData.id,
        employee_number: employee_number?.trim() || null,
      })
      .select("*")
      .single();

    if (teacherError || !teacherData) {
      console.error("ERREUR CRÉATION TEACHERS :", teacherError);

      await supabaseAdmin.from("users").delete().eq("id", userData.id);
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      createdAuthUserId = null;
      createdProfileId = null;

      return NextResponse.json(
        {
          success: false,
          error:
            teacherError?.message ??
            "Impossible de créer le profil enseignant.",
        },
        { status: 500 }
      );
    }

    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const { error: emailError } = await resend.emails.send({
      from: "EduSoft CG <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "Bienvenue sur EduSoft CG",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Bienvenue sur EduSoft CG</h1>
          <p>Bonjour ${escapeHtml(first_name.trim())},</p>
          <p>Votre compte enseignant a été créé par votre établissement.</p>
          <p><strong>Vos identifiants de connexion :</strong></p>
          <p>
            <strong>Email :</strong> ${escapeHtml(normalizedEmail)}<br>
            <strong>Mot de passe temporaire :</strong> ${escapeHtml(temporaryPassword)}
          </p>
          <p>Pour votre sécurité, nous vous recommandons de modifier votre mot de passe après votre première connexion.</p>
          <p>Cordialement,<br><strong>EduSoft CG</strong></p>
        </div>
      `,
    });

    if (emailError) {
      console.error("ERREUR ENVOI EMAIL :", emailError);

      await supabaseAdmin.from("teachers").delete().eq("id", teacherData.id);
      if (createdProfileId) {
        await supabaseAdmin.from("users").delete().eq("id", createdProfileId);
      }
      if (createdAuthUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }
      createdAuthUserId = null;
      createdProfileId = null;

      return NextResponse.json(
        {
          success: false,
          error:
            "Le compte n'a pas pu être finalisé car l'email d'accès n'a pas pu être envoyé.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Enseignant créé avec succès.",
        user: userData,
        teacher: teacherData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERREUR POST TEACHERS :", error);

    if (createdProfileId) {
      await supabaseAdmin.from("users").delete().eq("id", createdProfileId);
    }
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la création de l'enseignant.",
      },
      { status: 500 }
    );
  }
}
