"use client";

import { useState } from "react";
import {
  Activity, BookOpen, CalendarDays, ClipboardList, FileText,
  GraduationCap, LayoutDashboard, LogOut, Settings, ShieldCheck,
  UserRound, UsersRound, Wallet
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import type { PermissionCode } from "@/lib/auth";

type Space = "direction" | "administration" | "finance" | "vie-scolaire" | "rh" | "sante" | "pedagogie";
type Item = { label:string; href:string; icon:typeof LayoutDashboard; permissions?:PermissionCode[] };

const CONFIG: Record<Space,{title:string;subtitle:string;items:Item[]}> = {
 direction:{title:"Espace direction",subtitle:"Pilotage établissement",items:[
  {label:"Tableau de bord",href:"/dashboard",icon:LayoutDashboard,permissions:["dashboard.read"]},
  {label:"Administration",href:"/administration",icon:ShieldCheck,permissions:["students.read","enrollments.read","parents.read"]},
  {label:"Pédagogie",href:"/pedagogie",icon:BookOpen,permissions:["classes.read","subjects.read"]},
  {label:"Finance",href:"/finance",icon:Wallet,permissions:["finance.read","financial_reports.read"]},
  {label:"Vie scolaire",href:"/vie-scolaire",icon:Activity,permissions:["attendance.read","discipline.read"]},
  {label:"Communication",href:"/communication",icon:FileText,permissions:["communication.read","communication.send"]},
  {label:"Paramètres",href:"/parametres",icon:Settings,permissions:["settings.read","settings.manage"]}
 ]},
 administration:{title:"Espace administration",subtitle:"Élèves · parents · inscriptions",items:[
  {label:"Accueil",href:"/administration",icon:LayoutDashboard},
  {label:"Élèves",href:"/administration/eleves",icon:GraduationCap,permissions:["students.read","students.create","students.update"]},
  {label:"Parents / tuteurs",href:"/administration/parents",icon:UsersRound,permissions:["parents.read","parents.manage"]},
  {label:"Inscriptions",href:"/administration/inscriptions",icon:FileText,permissions:["enrollments.read","enrollments.manage"]}
 ]},
 finance:{title:"Espace finance",subtitle:"Comptabilité · paiements",items:[
  {label:"Accueil",href:"/finance",icon:LayoutDashboard},
  {label:"Paiements",href:"/finance/paiements",icon:Wallet,permissions:["payments.create","finance.read"]},
  {label:"Frais scolaires",href:"/finance/frais",icon:FileText,permissions:["finance.read","finance.manage"]},
  {label:"Rapports",href:"/finance/rapports",icon:ClipboardList,permissions:["financial_reports.read"]}
 ]},
 "vie-scolaire":{title:"Espace vie scolaire",subtitle:"Présences · discipline",items:[
  {label:"Accueil",href:"/vie-scolaire",icon:LayoutDashboard},
  {label:"Présences",href:"/vie-scolaire/presences",icon:CalendarDays,permissions:["attendance.read","attendance.write"]},
  {label:"Discipline",href:"/vie-scolaire/discipline",icon:ShieldCheck,permissions:["discipline.read","discipline.manage"]}
 ]},
 rh:{title:"Espace RH",subtitle:"Personnel · ressources humaines",items:[
  {label:"Accueil",href:"/rh",icon:LayoutDashboard},
  {label:"Personnel",href:"/rh/personnel",icon:UsersRound,permissions:["hr.read","hr.manage"]},
  {label:"Documents RH",href:"/rh/documents",icon:FileText,permissions:["documents.read","documents.upload"]}
 ]},
 sante:{title:"Espace infirmerie",subtitle:"Données de santé protégées",items:[
  {label:"Accueil",href:"/sante",icon:LayoutDashboard},
  {label:"Dossiers santé",href:"/sante/dossiers",icon:Activity,permissions:["health.read","health.manage"]}
 ]},
 pedagogie:{title:"Espace pédagogique",subtitle:"Classes · matières · évaluations",items:[
  {label:"Accueil",href:"/pedagogie",icon:LayoutDashboard},
  {label:"Classes",href:"/pedagogie/classes",icon:GraduationCap,permissions:["classes.read","classes.manage"]},
  {label:"Matières",href:"/pedagogie/matieres",icon:BookOpen,permissions:["subjects.read","subjects.manage"]},
  {label:"Emploi du temps",href:"/pedagogie/emploi-du-temps",icon:CalendarDays,permissions:["planning.read","planning.manage"]},
  {label:"Notes & bulletins",href:"/pedagogie/notes-bulletins",icon:ClipboardList,permissions:["grades.read","grades.write","report_cards.read","report_cards.manage"]}
 ]}
};

export default function WorkspaceSidebar({space}:{space:Space}) {
 const pathname=usePathname(); const router=useRouter();
 const {profile,school,role,hasAnyPermission}=useCurrentUser();
 const [loggingOut,setLoggingOut]=useState(false);
 const config=CONFIG[space];
 const items=config.items.filter(i=>!i.permissions||hasAnyPermission(...i.permissions));
 const fullName=[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")||"Utilisateur";
 const logout=async()=>{setLoggingOut(true);await supabase.auth.signOut();router.replace("/");router.refresh();};
 return <aside className="fixed inset-y-0 left-0 z-50 w-[270px] bg-[#1A2451] text-white"><div className="flex h-full flex-col">
  <div className="border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><GraduationCap className="h-6 w-6"/></div><div className="min-w-0"><p className="truncate text-base font-bold">{config.title}</p><p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/45">{config.subtitle}</p></div></div></div>
  <nav className="flex-1 overflow-y-auto px-3 py-5"><div className="space-y-1">{items.map(item=>{const Icon=item.icon;const active=pathname===item.href||pathname.startsWith(item.href+"/");return <button key={item.href} type="button" onClick={()=>router.push(item.href)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active?"bg-white/10 text-white":"text-white/65 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]"/><span>{item.label}</span></button>})}</div></nav>
  <div className="border-t border-white/10 p-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366F1]"><UserRound className="h-5 w-5"/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{fullName}</p><p className="truncate text-xs text-white/45">{role||"Utilisateur"} · {school?.name||"EduSoft CG"}</p></div></div><button type="button" onClick={logout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"><LogOut className="h-[18px] w-[18px]"/>{loggingOut?"Déconnexion…":"Se déconnecter"}</button></div>
 </div></aside>;
}
