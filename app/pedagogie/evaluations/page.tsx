"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, FileText, Send, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Assessment={id:string;title:string;status:string;assessment_date:string|null;max_score:number|null;coefficient:number|null;teacher_id:string|null;class_id:string|null;class_subject_id:string|null;assessment_type_id:string|null;school_id:string};
type Type={id:string;name:string;code:string;is_exam:boolean;is_departmental:boolean;default_weight:number};
type Item={id:string;name:string};
const transitions:{[key:string]:string[]}={draft:["submitted"],changes_requested:["submitted"],submitted:["in_review","approved","rejected"],in_review:["changes_requested","approved","rejected"],approved:["scheduled","published"],scheduled:["published"],published:["completed"],completed:["archived"]};

export default function EvaluationsPage(){
 const [items,setItems]=useState<Assessment[]>([]),[types,setTypes]=useState<Type[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 const [filter,setFilter]=useState("all"),[selected,setSelected]=useState<Assessment|null>(null),[comment,setComment]=useState("");
 const [classes,setClasses]=useState<Item[]>([]),[subjects,setSubjects]=useState<Item[]>([]);
 useEffect(()=>{void load()},[]);
 async function load(){
  setLoading(true);setMessage("");
  const [{data:a,error:ae},{data:t,error:te},{data:c},{data:s}]=await Promise.all([
   supabase.from("assessments").select("id,title,status,assessment_date,max_score,coefficient,teacher_id,class_id,class_subject_id,assessment_type_id,school_id").order("created_at",{ascending:false}),
   supabase.from("assessment_types").select("id,name,code,is_exam,is_departmental,default_weight").eq("is_active",true).order("name"),
   supabase.from("classes").select("id,name").order("name"),
   supabase.from("subjects").select("id,name").order("name")
  ]);
  if(ae||te){setMessage((ae||te)!.message);setLoading(false);return}
  setItems((a||[]) as Assessment[]);setTypes((t||[]) as Type[]);setClasses(c||[]);setSubjects(s||[]);setLoading(false);
 }
 const typeName=(id:string|null)=>types.find(t=>t.id===id)?.name||"Évaluation";
 const className=(id:string|null)=>classes.find(c=>c.id===id)?.name||"Classe";
 const next=(s:string)=>transitions[s]||[];
 async function changeStatus(a:Assessment,to:string,action:string){
  setSaving(true);setMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  const {data:profile}=user?await supabase.from("users").select("id").eq("auth_user_id",user.id).maybeSingle():{data:null};
  const patch:any={status:to};
  if(action==="submit"){patch.submitted_at=new Date().toISOString();patch.submitted_by=profile?.id??null;}
  if(action==="approve"){patch.validated_at=new Date().toISOString();patch.validated_by=profile?.id??null;patch.rejection_reason=null;}
  if(action==="reject"||action==="request_changes")patch.rejection_reason=comment.trim()||"Motif non précisé";
  const r=await supabase.from("assessments").update(patch).eq("id",a.id).eq("school_id",a.school_id);
  if(r.error){setMessage(r.error.message);setSaving(false);return}
  const log=await supabase.from("assessment_workflow_actions").insert({assessment_id:a.id,action,from_status:a.status,to_status:to,actor_user_id:profile?.id??null,comment:comment.trim()||null});
  if(log.error)setMessage(log.error.message); else setMessage("Workflow mis à jour.");
  setComment("");setSelected({...a,...patch});await load();setSaving(false);
 }
 const label=(s:string)=>({draft:"Brouillon",submitted:"Soumis",in_review:"En vérification",changes_requested:"Correction demandée",rejected:"Rejeté",approved:"Validé",scheduled:"Programmé",published:"Publié",completed:"Terminé",archived:"Archivé"} as any)[s]||s;
 const filtered=items.filter(x=>filter==="all"||x.status===filter);
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
  <header><p className="text-sm font-semibold text-violet-700">Pédagogie</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Évaluations & examens</h1><p className="mt-2 text-sm text-slate-500">Suivi des devoirs, contrôles, compositions et examens avec validation pédagogique avant utilisation.</p></header>
  <div className="flex flex-wrap gap-2">{["all","draft","submitted","in_review","changes_requested","rejected","approved","scheduled","published"].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter===s?"bg-violet-600 text-white":"bg-white text-slate-600 border"}`}>{s==="all"?"Tous":label(s)}</button>)}</div>
  {message&&<div className="rounded-xl border bg-white p-4 text-sm text-slate-700">{message}</div>}
  <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="divide-y divide-slate-100">
   {loading?<div className="p-10 text-center text-sm text-slate-400">Chargement…</div>:!filtered.length?<div className="p-10 text-center text-sm text-slate-400">Aucune évaluation dans ce statut.</div>:filtered.map(a=><div key={a.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex gap-3"><FileText className="mt-1 h-5 w-5 text-violet-600"/><div><p className="font-semibold text-slate-900">{a.title}</p><p className="mt-1 text-sm text-slate-500">{className(a.class_id)} · {typeName(a.assessment_type_id)} · /{a.max_score??20} · coef. {a.coefficient??1}</p><p className="mt-1 text-xs text-slate-400">{a.assessment_date||"Date non définie"}</p></div></div>
    <div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">{label(a.status)}</span><button onClick={()=>setSelected(a)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Ouvrir</button></div>
   </div>)}
  </div></section>
  {selected&&<div className="fixed inset-0 z-50 bg-slate-950/40 p-4" onClick={()=>setSelected(null)}><div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
    <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase text-violet-600">{typeName(selected.assessment_type_id)}</p><h2 className="mt-1 text-xl font-bold">{selected.title}</h2><p className="mt-1 text-sm text-slate-500">{className(selected.class_id)} · {label(selected.status)}</p></div><button onClick={()=>setSelected(null)} className="text-slate-400">✕</button></div>
    <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm"><p><b>Barème :</b> /{selected.max_score??20}</p><p className="mt-1"><b>Coefficient :</b> {selected.coefficient??1}</p><p className="mt-1"><b>Date :</b> {selected.assessment_date||"—"}</p></div>
    {next(selected.status).length>0&&<><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Observation ou motif (obligatoire pour retour/rejet)" className="mt-5 min-h-24 w-full rounded-xl border p-3 text-sm"/>
      <div className="mt-4 flex flex-wrap gap-2">{next(selected.status).map(to=>{const action=to==="submitted"?"submit":to==="in_review"?"review":to==="changes_requested"?"request_changes":to==="rejected"?"reject":to==="approved"?"approve":to==="scheduled"?"schedule":to==="published"?"publish":to==="completed"?"complete":"archive";return <button key={to} disabled={saving} onClick={()=>void changeStatus(selected,to,action)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${to==="rejected"||to==="changes_requested"?"bg-amber-100 text-amber-800":to==="approved"?"bg-emerald-600 text-white":"bg-violet-600 text-white"}`}>{to==="approved"?<CheckCircle2 className="h-4 w-4"/>:to==="rejected"?<XCircle className="h-4 w-4"/>:<Send className="h-4 w-4"/>}{label(to)}</button>})}</div></>}
    {!next(selected.status).length&&<div className="mt-5 flex items-center gap-2 text-sm text-emerald-700"><ClipboardCheck className="h-4 w-4"/>Aucune transition disponible.</div>}
  </div></div>}
 </div></main>
}