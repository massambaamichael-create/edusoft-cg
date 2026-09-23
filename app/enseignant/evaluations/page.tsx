"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Files, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row={id:string;title:string;status:string;variant_count:number;variant_strategy:string;assessment_date:string|null;assessment_type_id:string|null;class_subject_id:string|null;academic_year_id:string|null};
type Type={id:string;name:string};

const statusLabel:Record<string,string>={draft:"Brouillon",submitted:"Soumis",in_review:"En vérification",changes_requested:"Modifications demandées",rejected:"Rejeté",approved:"Validé",scheduled:"Programmé",published:"Publié",completed:"Terminé",archived:"Archivé"};

export default function EnseignantEvaluations(){
 const router=useRouter();
 const [rows,setRows]=useState<Row[]>([]),[types,setTypes]=useState<Type[]>([]),[query,setQuery]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 useEffect(()=>{void load()},[]);
 async function load(){
  setLoading(true);setError(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/");return}
   const {data:u,error:ue}=await supabase.from("users").select("id").eq("auth_user_id",session.user.id).single();if(ue)throw ue;
   const {data:t,error:te}=await supabase.from("teachers").select("id").eq("user_id",u.id).maybeSingle();if(te)throw te;if(!t){setRows([]);return}
   const [{data:a,error:ae},{data:ty,error:ye}]=await Promise.all([
    supabase.from("assessments").select("id,title,status,variant_count,variant_strategy,assessment_date,assessment_type_id,class_subject_id,academic_year_id").eq("teacher_id",t.id).order("created_at",{ascending:false}),
    supabase.from("assessment_types").select("id,name").eq("is_active",true).order("name")
   ]);
   if(ae)throw ae;if(ye)throw ye;setRows((a??[]) as Row[]);setTypes((ty??[]) as Type[]);
  }catch(e){setError(e instanceof Error?e.message:"Impossible de charger vos évaluations.");}finally{setLoading(false)}
 }
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return q?rows.filter(r=>[r.title,statusLabel[r.status]??r.status,types.find(t=>t.id===r.assessment_type_id)?.name??""].join(" ").toLowerCase().includes(q)):rows},[query,rows,types]);
 return <main className="min-h-full bg-[#F6F7FB] p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
  <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-slate-500">Espace Enseignant</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Évaluations & sujets</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Créez et suivez vos sujets à partir de vos affectations pédagogiques officielles.</p></div>
   <button onClick={()=>router.push("/enseignant/evaluations/nouveau")} className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"><FilePlus2 className="h-4 w-4"/>Nouveau sujet</button>
  </header>
  <div className="grid gap-4 md:grid-cols-3"><Info icon={Files} title="Variantes" text="A, B, C… pour un même devoir ou examen."/><Info icon={ShieldCheck} title="Validation" text="Le sujet suit le circuit de validation pédagogique."/><Info icon={FilePlus2} title="IA & PDF" text="Préparez un sujet depuis le programme ou importez un document." /></div>
  {error&&<div className="rounded-[18px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
   <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-slate-900">Mes évaluations</h2><p className="mt-1 text-xs text-slate-500">Données limitées à vos évaluations.</p></div><div className="relative w-full md:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher…" className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5"/></div></div>
   {loading?<div className="p-10 text-center text-sm text-slate-400">Chargement…</div>:!filtered.length?<div className="p-10 text-center text-sm text-slate-400">Aucune évaluation trouvée.</div>:<div className="divide-y divide-slate-100">{filtered.map(r=><div key={r.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="font-semibold text-slate-900">{r.title}</p><p className="mt-1 text-sm text-slate-500">{types.find(t=>t.id===r.assessment_type_id)?.name??"Évaluation"} · {r.variant_count} variante{r.variant_count>1?"s":""} · {r.assessment_date??"Date non fixée"}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{statusLabel[r.status]??r.status}</span><button onClick={()=>router.push(`/enseignant/evaluations/${r.id}`)} className="rounded-[14px] border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ouvrir</button></div></div>)}</div>}
  </section>
 </div></main>
}
function Info({icon:Icon,title,text}:{icon:typeof Files;title:string;text:string}){return <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]"><Icon className="h-5 w-5 text-slate-700"/><p className="mt-3 font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>}
