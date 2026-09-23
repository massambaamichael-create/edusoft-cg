import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

const ALLOWED_ROLES = new Set(["Directeur", "Administrateur", "Secrétaire"]);

function clean(v: unknown) { return typeof v === "string" ? v.trim() : ""; }

function escapeHtml(value: string) {
  return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

async function authorize(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: NextResponse.json({success:false,error:"Authentification requise."},{status:401}) };
  const {data:{user},error:authError}=await supabaseAdmin.auth.getUser(token);
  if(authError||!user) return {error:NextResponse.json({success:false,error:"Session invalide ou expirée."},{status:401})};
  const {data:profile}=await supabaseAdmin.from("users").select("id,school_id,is_active,roles(name)").eq("auth_user_id",user.id).single();
  const role=Array.isArray(profile?.roles)?profile?.roles[0]:profile?.roles;
  const roleName=(role as {name?:string}|null)?.name??"";
  if(!profile||profile.is_active===false||!ALLOWED_ROLES.has(roleName)) return {error:NextResponse.json({success:false,error:"Action non autorisée."},{status:403})};
  return {profile:{id:profile.id,school_id:profile.school_id,roleName}};
}

export async function POST(request: Request) {
  try {
    const auth=await authorize(request); if("error" in auth) return auth.error;
    const body=await request.json();
    const action=clean(body?.action);
    const userId=clean(body?.user_id);
    if(!userId || !["activate","deactivate","reset_password"].includes(action))
      return NextResponse.json({success:false,error:"Action ou compte invalide."},{status:400});

    const {data:target,error:targetError}=await supabaseAdmin.from("users")
      .select("id,auth_user_id,school_id,first_name,last_name,email,login_identifier,is_active,roles(name)")
      .eq("id",userId).eq("school_id",auth.profile.school_id).single();
    if(targetError||!target?.auth_user_id) return NextResponse.json({success:false,error:"Compte introuvable dans votre établissement."},{status:404});

    const targetRole=Array.isArray(target.roles)?target.roles[0]:target.roles;
    const targetRoleName=(targetRole as {name?:string}|null)?.name??"";
    if(target.id===auth.profile.id || targetRoleName==="Directeur" && auth.profile.roleName!=="Directeur")
      return NextResponse.json({success:false,error:"Ce compte ne peut pas être modifié depuis cet espace."},{status:403});

    if(action==="activate" || action==="deactivate") {
      const active=action==="activate";
      const {error:authUpdateError}=await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id,{ban_duration:active?"none":"876000h"});
      if(authUpdateError) return NextResponse.json({success:false,error:authUpdateError.message},{status:500});
      const {error:dbError}=await supabaseAdmin.from("users").update({is_active:active}).eq("id",target.id).eq("school_id",auth.profile.school_id);
      if(dbError) return NextResponse.json({success:false,error:dbError.message},{status:500});
      return NextResponse.json({success:true,action,status:active?"active":"inactive"});
    }

    const temporaryPassword=crypto.randomBytes(12).toString("base64url");
    const {error:passwordError}=await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id,{password:temporaryPassword});
    if(passwordError) return NextResponse.json({success:false,error:passwordError.message},{status:500});
    const {error:profileError}=await supabaseAdmin.from("users").update({must_change_password:true}).eq("id",target.id);
    if(profileError) return NextResponse.json({success:false,error:profileError.message},{status:500});

    const email=clean(target.email).toLowerCase();
    if(email && !email.endsWith("@login.edusoft.cg")) {
      const {error:mailError}=await resend.emails.send({
        from:"EduSoft CG <onboarding@resend.dev>",to:[email],subject:"Réinitialisation de votre accès EduSoft CG",
        html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1>EduSoft CG</h1><p>Bonjour ${escapeHtml(clean(target.first_name))},</p><p>Votre accès a été réinitialisé par votre établissement.</p><p><strong>Identifiant :</strong> ${escapeHtml(target.login_identifier || email)}</p><p><strong>Nouveau mot de passe temporaire :</strong> ${escapeHtml(temporaryPassword)}</p><p>Le changement du mot de passe est obligatoire à la prochaine connexion.</p></div>`
      });
      if(mailError) return NextResponse.json({success:false,error:"Le mot de passe a été renouvelé mais son envoi a échoué. Transmettez-le par un canal sécurisé.",temporaryPassword,delivery:"admin"},{status:502});
      return NextResponse.json({success:true,action,identifier:target.login_identifier||email,delivery:"email"});
    }
    return NextResponse.json({success:true,action,identifier:target.login_identifier||email,temporaryPassword,delivery:"admin"});
  } catch(error) {
    console.error("ERREUR GESTION IDENTITE :",error);
    return NextResponse.json({success:false,error:"Erreur serveur lors de la gestion du compte."},{status:500});
  }
}
