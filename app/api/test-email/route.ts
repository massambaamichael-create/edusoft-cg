import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: "EduSoft CG <onboarding@resend.dev>",
      to: ["massambaamichael@gmail.com"

],
      subject: "Test EduSoft CG",
      html: `
        <h1>Test EduSoft CG</h1>
        <p>Si tu reçois cet email, la connexion entre EduSoft CG et Resend fonctionne correctement.</p>
      `,
    });

    if (error) {
      console.error("ERREUR RESEND :", error);

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
      message: "Email envoyé avec succès.",
      data,
    });
  } catch (error) {
    console.error("ERREUR TEST EMAIL :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'envoi de l'email.",
      },
      { status: 500 }
    );
  }
}