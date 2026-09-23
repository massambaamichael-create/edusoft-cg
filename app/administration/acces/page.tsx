"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, LockKeyhole, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";

type Account = {
  id: string; first_name: string | null; last_name: string | null; email: string | null;
  login_identifier: string | null; phone: string | null; is_active: boolean;
  must_change_password: boolean; created_at: string | null; role: string;
};

const roleOrder = ["Directeur","Administrateur","Secrétaire","Comptable","RH","Infirmerie","Surveillant","Enseignant","Parent","Élève"];

export default function AdministrationAccountsPage() {
  const { school, role, loading: userLoading } = useCurrentUser();
  const canManage = ["Directeur","Administrateur","Secrétaire"].includes(role || "");
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [q,setQ]=useState("");
  const [roleFilter,setRoleFilter]=useState("Tous");
  const [busy,setBusy]=useState("");
  const [credentials,setCredentials]=useState<{identifier:string;password:string}|null>(null);
  const [confirm,setConfirm]=useState<{account:Account;action:"activate"|"deactivate"}|null>(null);

  const load=async()=>{
    setLoading(true); setError("");
    try{
      const {data:{session}}=await createClient().auth.getSession();
      if(!session?.access_token) throw new Error("Session expirée. Reconnectez-vous.");
      const r=await fetch("/api/identity/manage",{headers:{Authorization:`Bearer ${session.access_token}`}});
      const data=await r.json();
      if(!r.ok||!data.success) throw new Error(data.error||"Impossible de charger les comptes.");
      setAccounts(data.accounts||[]);
    }catch(e){setError(e instanceof Error?e.message:"Erreur lors du chargement.");}
    finally{setLoading(false);}
  };

  useEffect(()=>{if(!userLoading&&canManage) void load();},[userLoading,canManage]);

  const roles=useMemo(()=>["Tous",...roleOrder.filter(r=>accounts.some(a=>a.role===r))],[accounts]);
  const filtered=useMemo(()=>{
    const term=q.trim().toLowerCase();
    return accounts.filter(a=>{
      const matchesRole=roleFilter==="Tous"||a.role===roleFilter;
      const blob=[a.first_name,a.last_name,a.email,a.phone,a.login_identifier,a.role].filter(Boolean).join(" ").toLowerCase();
      return matchesRole&&(!term||blob.includes(term));
    });
  },[accounts,q,roleFilter]);

  const act=async(account:Account,action:"activate"|"deactivate"|"reset_password")=>{
    setBusy(account.id+action); setError("");
    try{
      const {data:{session}}=await createClient().auth.getSession();
      if(!session?.access_token) throw new Error("Session expirée. Reconnectez-vous.");
      const r=await fetch("/api/identity/manage",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,user_id:account.id})});
      const data=await r.json();
      if(!r.ok||!data.success){
        if(data.temporaryPassword) setCredentials({identifier:data.identifier||account.login_identifier||"",password:data.temporaryPassword});
        throw new Error(data.error||"Action impossible.");
      }
      if(action==="reset_password" && data.temporaryPassword) setCredentials({identifier:data.identifier,password:data.temporaryPassword});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Action impossible.");}
    finally{setBusy("");setConfirm(null);}
  };

  if(!userLoading&&!canManage) return <main className="min-h-full bg-[#F6F7FB] px-6 py-8 lg:px-10"><p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Accès réservé aux responsables habilités.</p></main>;

  return <main className="min-h-full bg-[#F6F7FB] px-5 py-7 lg:px-10 lg:py-9">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400"><ShieldCheck className="h-4 w-4"/> Administration · Identity & Access</div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Accès & comptes</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Gérez les comptes rattachés à cet établissement sans exposer ni stocker les mots de passe.</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"><LockKeyhole className="h-4 w-4"/></div><div><p className="text-xs font-bold text-slate-900">Accès contrôlés</p><p className="text-[11px] text-slate-400">{school?.name||"EduSoft CG"}</p></div></div>
    </header>

    <section className="mb-5 grid gap-4 sm:grid-cols-3">
      {[["Comptes",accounts.length],["Actifs",accounts.filter(a=>a.is_active).length],["Changement requis",accounts.filter(a=>a.must_change_password).length]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>)}
    </section>

    <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
        <div><p className="text-sm font-bold text-slate-900">Répertoire des accès</p><p className="mt-0.5 text-xs text-slate-400">Une identité centrale, un rôle, un accès contrôlé.</p></div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="relative min-w-[240px] flex-1 sm:flex-none"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nom, identifiant, rôle…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"/></div>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none">{roles.map(r=><option key={r}>{r}</option>)}</select>
        </div>
      </div>

      {error&&<div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading?<div className="p-10 text-center text-sm text-slate-500">Chargement des comptes…</div>:filtered.length===0?<div className="p-12 text-center"><UserRound className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">Aucun compte correspondant</p><p className="mt-1 text-xs text-slate-400">Modifiez votre recherche ou votre filtre.</p></div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-[0.15em] text-slate-500"><tr><th className="px-5 py-3.5">Identité</th><th className="px-4 py-3.5">Rôle</th><th className="px-4 py-3.5">Identifiant</th><th className="px-4 py-3.5">État</th><th className="px-4 py-3.5 text-right">Actions</th></tr></thead><tbody>{filtered.map(a=><tr key={a.id} className="border-b border-slate-50 last:border-0 transition hover:bg-slate-50/70">
        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><UserRound className="h-4 w-4"/></div><div><p className="font-semibold text-slate-900">{[a.first_name,a.last_name].filter(Boolean).join(" ")||"Sans nom"}</p><p className="mt-0.5 text-xs text-slate-400">{a.email||a.phone||"Aucun contact"}</p></div></div></td>
        <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{a.role}</span></td>
        <td className="px-4 py-4 font-mono text-xs text-slate-600">{a.login_identifier||a.email||"—"}</td>
        <td className="px-4 py-4"><div className="flex flex-col gap-1"><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${a.is_active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${a.is_active?"bg-emerald-500":"bg-slate-400"}`}/>{a.is_active?"Actif":"Désactivé"}</span>{a.must_change_password&&<span className="text-[10px] font-medium text-amber-600">Mot de passe à renouveler</span>}</div></td>
        <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2">{a.is_active?<button disabled={busy===a.id+"deactivate"} onClick={()=>setConfirm({account:a,action:"deactivate"})} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Désactiver</button>:<button disabled={busy===a.id+"activate"} onClick={()=>setConfirm({account:a,action:"activate"})} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50">Réactiver</button>}<button disabled={busy===a.id+"reset_password"} onClick={()=>act(a,"reset_password")} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"><KeyRound className="h-3.5 w-3.5"/>Réinitialiser</button></div></td>
      </tr>)}</tbody></table></div>}
    </section>

    {confirm&&<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[26px] border border-slate-200 bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Sécurité du compte</p><h2 className="mt-2 text-xl font-bold text-slate-950">{confirm.action==="deactivate"?"Désactiver":"Réactiver"} cet accès ?</h2><p className="mt-2 text-sm leading-6 text-slate-500">{[confirm.account.first_name,confirm.account.last_name].filter(Boolean).join(" ")} · {confirm.account.role}</p></div><button onClick={()=>setConfirm(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4"/></button></div><div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">{confirm.action==="deactivate"?"La connexion sera bloquée et le compte restera conservé dans l'établissement.":"La connexion sera de nouveau autorisée avec les mêmes informations de compte."}</div><div className="mt-6 flex gap-2"><button onClick={()=>setConfirm(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Annuler</button><button onClick={()=>act(confirm.account,confirm.action)} className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{confirm.action==="deactivate"?"Désactiver":"Réactiver"}</button></div></div></div>}

    {credentials&&<div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"><CheckCircle2 className="h-5 w-5"/></div><h2 className="mt-4 text-xl font-bold text-slate-950">Accès réinitialisé</h2></div><button onClick={()=>setCredentials(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4"/></button></div><div className="mt-5 rounded-2xl bg-slate-50 p-4 space-y-3"><div><p className="text-xs text-slate-400">Identifiant</p><p className="mt-1 font-mono text-sm font-bold text-slate-900">{credentials.identifier}</p></div><div><p className="text-xs text-slate-400">Mot de passe temporaire</p><p className="mt-1 font-mono text-sm font-bold text-slate-900">{credentials.password}</p></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Ce mot de passe temporaire n'est affiché qu'une seule fois. Le changement est obligatoire à la prochaine connexion.</p><button onClick={()=>setCredentials(null)} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Fermer</button></div></div>}
  </main>;
}
