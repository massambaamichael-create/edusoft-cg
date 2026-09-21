"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Program={id:string;name:string;subject_id:string;cycle_id:string;level_id:string;series_id:string|null};
type Version={id:string;version_number:number;name:string};
type Unit={id:string;title:string;unit_type:string;display_order:number};
type Entry={program_unit_id:string;status:string;coverage_percent:number;notes:string|null};

export default function TeacherProgrammePage(){
 const {id}=useParams<{id:string}>(),router=useRouter(),search=useSearchParams();
 const classId=search.get("classId"),yearId=search.get("yearId");
 const [program,setProgram]=useState<Program|null>(null),[version,setVersion]=useState<Version|null>(null),[units,setUnits]=useState<Unit[]>([]),[entries,setEntries]=useState<Record<string,Entry>>({});
 const [className,setClassName]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null);

 // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
 useEffect(()=>{void load()},[id,classId,yearId]);
 async function load(){
  if(!classId||!yearId){setError("Classe ou année scolaire manquante.");setLoading(false);return}
  setLoading(true);setError(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/");return}
   const {data:u,error:ue}=await supabase.from("users").select("id").eq("auth_user_id",session.user.id).single();if(ue)throw ue;
   const {data:t,error:te}=await supabase.from("teachers").select("id").eq("user_id",u.id).maybeSingle();if(te)throw te;if(!t)throw new Error("Profil enseignant introuvable.");
   const {data:p,error:pe}=await supabase.from("programs").select("id,name,subject_id,cycle_id,level_id,series_id").eq("id",id).single();if(pe)throw pe;setProgram(p);
   const {data:cs,error:ce}=await supabase.from("class_subjects").select("id").eq("class_id",classId).eq("subject_id",p.subject_id).eq("academic_year_id",yearId).eq("is_active",true);if(ce)throw ce;
   const ids=(cs??[]).map(x=>x.id);if(!ids.length)throw new Error("Cette matière n'est pas configurée dans la classe.");
   const {data:ta,error:ae}=await supabase.from("teacher_assignments").select("id").eq("teacher_id",t.id).in("class_subject_id",ids).eq("academic_year_id",yearId).eq("status","active").maybeSingle();if(ae)throw ae;if(!ta)throw new Error("Cette classe et cette matière ne font pas partie de vos affectations officielles.");
   const [{data:versions,error:ve},{data:cl,error:cle}]=await Promise.all([
    supabase.from("program_versions").select("id,version_number,name").eq("program_id",id).in("status",["published","draft"]).order("version_number",{ascending:false}).limit(1),
    supabase.from("classes").select("name").eq("id",classId).single()
   ]);if(ve)throw ve;if(cle)throw cle;
   const v=(versions??[])[0] as Version|undefined;if(!v)throw new Error("Aucune version du programme n'est disponible.");setVersion(v);setClassName(cl?.name??"");
   const {data:pa,error:pae}=await supabase.from("program_class_assignments").select("id").eq("program_version_id",v.id).eq("class_id",classId).eq("academic_year_id",yearId).eq("status","active").maybeSingle();if(pae)throw pae;if(!pa)throw new Error("Le programme n'est pas encore affecté à cette classe.");
   const [{data:us,error:ue2},{data:es,error:ee}]=await Promise.all([
    supabase.from("program_units").select("id,title,unit_type,display_order").eq("program_version_id",v.id).order("display_order").order("created_at"),
    supabase.from("progression_entries").select("program_unit_id,status,coverage_percent,notes").eq("program_class_assignment_id",pa.id)
   ]);if(ue2)throw ue2;if(ee)throw ee;
   setUnits((us??[]) as Unit[]);setEntries(Object.fromEntries((es??[]).map(e=>[e.program_unit_id,e as Entry])));
  }catch(e){setError(e instanceof Error?e.message:"Impossible de charger la progression.");}finally{setLoading(false)}
 }
 async function save(unit:Unit){
  if(!version||!classId||!yearId)return;
  setSaving(true);setError(null);
  try{
   const {data:pa,error:pe}=await supabase.from("program_class_assignments").select("id").eq("program_version_id",version.id).eq("class_id",classId).eq("academic_year_id",yearId).eq("status","active").maybeSingle();if(pe)throw pe;if(!pa)throw new Error("Affectation du programme introuvable.");
   const e=entries[unit.id]??{program_unit_id:unit.id,status:"planned",coverage_percent:0,notes:null};
   const {error}=await supabase.from("progression_entries").upsert({program_class_assignment_id:pa.id,program_unit_id:unit.id,status:e.status,coverage_percent:e.coverage_percent,notes:e.notes},{onConflict:"program_class_assignment_id,program_unit_id"});if(error)throw error;
  }catch(e){setError(e instanceof Error?e.message:"Enregistrement impossible.");}finally{setSaving(false)}
 }
 if(loading)return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-slate-500">Chargement de la progression…</main>;
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8">
  <button onClick={()=>router.push("/enseignant")} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/> Mon espace</button>
  <header className="mb-7"><p className="text-sm text-slate-400">Progression pédagogique</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{program?.name}</h1><p className="mt-2 text-sm text-slate-500">{className} · Version {version?.version_number} · {version?.name}</p></header>
  {error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Progression réelle</h2><p className="mt-1 text-xs text-slate-500">Mettez à jour uniquement les unités du programme de votre classe.</p></div>
   <div className="divide-y divide-slate-100">
    {!units.length&&<div className="p-10 text-center text-sm text-slate-400">Aucune unité pédagogique.</div>}
    {units.map(u=>{const e=entries[u.id]??{program_unit_id:u.id,status:"planned",coverage_percent:0,notes:null};return <div key={u.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_130px_auto] lg:items-center">
      <div><p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">{u.unit_type}</p><p className="mt-1 font-semibold text-slate-800">{u.title}</p></div>
      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={e.status} onChange={ev=>setEntries(x=>({...x,[u.id]:{...e,status:ev.target.value}}))}><option value="planned">Prévu</option><option value="in_progress">En cours</option><option value="taught">Enseigné</option><option value="reinforcement">À renforcer</option><option value="not_applicable">Non applicable</option></select>
      <div><label className="text-xs text-slate-400">Couverture %</label><input type="number" min="0" max="100" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={e.coverage_percent} onChange={ev=>setEntries(x=>({...x,[u.id]:{...e,coverage_percent:Math.max(0,Math.min(100,Number(ev.target.value)||0))}}))}/></div>
      <button disabled={saving} onClick={()=>void save(u)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving?"…":"Enregistrer"}</button>
    </div>})}
   </div>
  </section>
 </main>
}
