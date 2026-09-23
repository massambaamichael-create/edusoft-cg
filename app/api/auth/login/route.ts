import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier =
      typeof body?.identifier === "string"
        ? body.identifier.trim().toLowerCase()
        : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    const { data: byIdentifier, error: identifierError } = await supabaseAdmin
      .from("users")
      .select("auth_user_id, email, login_identifier, is_active")
      .ilike("login_identifier", identifier)
      .limit(1)
      .maybeSingle();

    let profile = byIdentifier;
    let profileError = identifierError;

    if (!profile && !identifierError) {
      const byEmail = await supabaseAdmin
        .from("users")
        .select("auth_user_id, email, login_identifier, is_active")
        .ilike("email", identifier)
        .limit(1)
        .maybeSingle();

      profile = byEmail.data;
      profileError = byEmail.error;
    }

    if (profileError || !profile?.auth_user_id || !profile.email) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    if (profile.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Compte désactivé." },
        { status: 403 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { data, error } = await authClient.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("ERREUR API LOGIN :", error);
    return NextResponse.json(
      { success: false, error: "Impossible de terminer la connexion." },
      { status: 500 }
    );
  }
}
