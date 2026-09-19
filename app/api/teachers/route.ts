import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";
import { resend } from "@/lib/resend";
import { resolveRoleIdByName } from "@/lib/auth/permissions";

console.log(
  "RESEND API KEY présente :",
  !!process.env.RESEND_API_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .limit(1);

    if (error) {
      console.error("ERREUR API TEACHERS :", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connexion serveur Supabase OK",
      data,
    });
  } catch (error) {
    console.error("ERREUR API :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      school_id,
      employee_number,
    } = body;

    const temporaryPassword = crypto.randomBytes(9).toString("base64url");

    if (!first_name || !last_name || !email || !school_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Prénom, nom, email et école sont obligatoires.",
        },
        { status: 400 }
      );
    }

    // Resolve role by name (no hardcoded UUID)
    const teacherRoleId = await resolveRoleIdByName(
      supabaseAdmin,
      "Enseignant"
    );

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

    // 1. Création du compte Supabase Auth
    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("ERREUR CRÉATION AUTH :", authError);

      return NextResponse.json(
        {
          success: false,
          error: authError?.message ?? "Impossible de créer le compte.",
        },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;

    // 2. Création du profil dans users
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_user_id: authUserId,
        school_id,
        role_id: teacherRoleId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (userError || !userData) {
      console.error("ERREUR CRÉATION USERS :", userError);

      await supabaseAdmin.auth.admin.deleteUser(authUserId);

      return NextResponse.json(
        {
          success: false,
          error:
            userError?.message ??
            "Impossible de créer le profil utilisateur.",
        },
        { status: 500 }
      );
    }

    // 3. Création du profil enseignant
    const { data: teacherData, error: teacherError } =
      await supabaseAdmin
        .from("teachers")
        .insert({
          school_id,
          user_id: userData.id,
          employee_number: employee_number?.trim() || null,
        })
        .select("*")
        .single();

    if (teacherError || !teacherData) {
      console.error("ERREUR CRÉATION TEACHERS :", teacherError);

      await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userData.id);

      await supabaseAdmin.auth.admin.deleteUser(authUserId);

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

    const { error: emailError } = await resend.emails.send({
      from: "EduSoft CG <onboarding@resend.dev>",
      to: [email.trim()],
      subject: "Bienvenue sur EduSoft CG",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Bienvenue sur EduSoft CG</h1>

      <p>Bonjour ${first_name.trim()},</p>

      <p>
        Votre compte enseignant a été créé par votre établissement.
      </p>

      <p><strong>Vos identifiants de connexion :</strong></p>

      <p>
        <strong>Email :</strong> ${email.trim()}<br>
        <strong>Mot de passe temporaire :</strong> ${temporaryPassword}
      </p>

      <p>
        Pour votre sécurité, nous vous recommandons de modifier votre mot de passe
        après votre première connexion.
      </p>

      <p>
        Cordialement,<br>
        <strong>EduSoft CG</strong>
      </p>
    </div>
  `,
    });

    if (emailError) {
      console.error("ERREUR ENVOI EMAIL :", emailError);

      return NextResponse.json(
        {
          success: false,
          error:
            "L'enseignant a été créé, mais l'email d'accès n'a pas pu être envoyé.",
        },
        { status: 500 }
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

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la création de l'enseignant.",
      },
      { status: 500 }
    );
  }
}
