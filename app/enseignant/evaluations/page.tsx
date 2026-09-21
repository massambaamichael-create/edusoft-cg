"use client";

import { useEffect, useState } from "react";
import { FilePlus2, Files, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row={id:string;title:string;status:string;variant_count:number;variant_strategy:string;assessment_date:string|null;assessment_type_id:string|null};
type Type={id:string;name:string};

export default function EnseignantEvaluations(){
 const router=useRouter();
 const [rows,setRows]=useState<Row[]>([]),[types,setTypes]=useState<Type[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 // eslint-disable-next-line react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
 useEffect(()=>{void load()},[]);
 async function load(){
  setLoading(true);setError(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/");return}
   const {data:u,error:ue}=await supabase.from("users").select("id").eq("auth_user_id",session.user.id).single();if(ue)throw ue;
   const {data:t,error:te}=await supabase.from("teachers").select("id").eq("user_id",u.id).maybeSingle();if(te)throw te;if(!t){setRows([]);return}
   const [{data:a,error:ae},{data:ty,error:ye}]=await Promise.all([
    supabase.from("assessments").select("id,title,status,variant_count,variant_strategy,assessment_date,assessment_type_id").eq("teacher_id",t.id).order("created_at",{ascending:false}),
    supabase.from("assessment_types").select("id,name").eq("is_active",true).order("name")
   ]);
   if(ae)throw ae;if(ye)throw ye;setRows((a??[]) as Row[]);setTypes((ty??[]) as Type[]);
  }catch(e){setError(e instanceof Error?e.message:"Impossible de charger vos évaluations.");}finally{setLoading(false)}
 }
 const status=(s:string)=>({draft:"Brouillon",submitted:"Soumis",in_review:"En vérification",changes_requested:"Modifications demandées",rejected:"Rejeté",approved:"Validé",scheduled:"Programmé",published:"Publié",completed:"Terminé",archived:"Archivé"} as Record<string,string>)[s]??s;
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
  <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
   <div><p className="text-sm font-semibold text-violet-700">Espace Enseignant</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Évaluations & sujets</h1><p className="mt-2 text-sm text-slate-500">Créez un sujet à partir de vos affectations officielles, générez plusieurs variantes avec EduSoft IA ou importez un PDF.</p></div>
   <button onClick={()=>router.push("/enseignant/evaluations/nouveau")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"><FilePlus2 className="h-4 w-4"/> Nouveau sujet</button>
  </header>
  <div className="grid gap-4 md:grid-cols-3">
   <Info icon={Files} title="Plusieurs variantes" text="A, B, C… pour un même devoir ou examen."/>
   <Info icon={ShieldCheck} title="Validation humaine" text="Le sujet passe par le responsable de matière puis la validation pédagogique."/>
   <Info icon={FilePlus2} title="PDF ou IA" text="Importez votre sujet ou faites-le générer à partir du programme."/>
  </div>
  {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Mes évaluations</h2></div>
   {loading?<div className="p-10 text-center text-sm text-slate-400">Chargement…</div>:!rows.length?<div className="p-10 text-center text-sm text-slate-400">Aucune évaluation créée.</div>:
   <div className="divide-y divide-slate-100">{rows.map(r=><div key={r.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
    <div><p className="font-semibold text-slate-900">{r.title}</p><p className="mt-1 text-sm text-slate-500">{types.find(t=>t.id===r.assessment_type_id)?.name??"Évaluation"} · {r.variant_count} variante{r.variant_count>1?"s":""} · {r.assessment_date??"Date non fixée"}</p></div>
    <button onClick={()=>router.push(`/enseignant/evaluations/${r.id}`)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ouvrir</button><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{status(r.status)}</span>
   </div>)}</div>}
  </section>
 </div></main>
}
function Info({icon:Icon,title,text}:{icon:typeof Files;title:string;text:string}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-violet-600"/><p className="mt-3 font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>}
