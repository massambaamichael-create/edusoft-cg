import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Authentification requise." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Session invalide ou expirée." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, is_active, must_change_password")
      .eq("auth_user_id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profil utilisateur introuvable." },
        { status: 403 }
      );
    }

    if (profile.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Compte désactivé." },
        { status: 403 }
      );
    }

    if (profile.must_change_password !== true) {
      return NextResponse.json(
        { success: false, error: "Aucun changement de mot de passe n'est requis." },
        { status: 409 }
      );
    }

    const { error: passwordError } =
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password,
      });

    if (passwordError) {
      console.error("ERREUR CHANGEMENT MOT DE PASSE :", passwordError);
      return NextResponse.json(
        { success: false, error: "Impossible de mettre à jour le mot de passe." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ must_change_password: false })
      .eq("id", profile.id);

    if (updateError) {
      console.error("ERREUR FINALISATION COMPTE :", updateError);
      return NextResponse.json(
        {
          success: false,
          error:
            "Mot de passe modifié, mais la finalisation du compte a échoué. Réessayez.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mot de passe modifié. Votre compte est maintenant actif.",
    });
  } catch (error) {
    console.error("ERREUR API COMPLETE FIRST LOGIN :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
