"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Save, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Student={id:string;first_name:string;last_name:string;registration_number:string|null};
type Assessment={id:string;title:string;max_score:number|null;status:string;class_id:string|null;academic_year_id:string|null;school_id:string};
type VariantAssignment={student_id:string;assessment_variant_id:string};
type CorrectionSession={id:string;student_id:string;assessment_variant_id:string|null;status:string;normalized_score:number|null;feedback:string|null};
type Row={student:Student;variantId:string|null;sessionId:string|null;status:string;score:string;feedback:string};

export default function MassCorrectionPage(){
 const {assessmentId}=useParams<{assessmentId:string}>(); const router=useRouter();
 const [assessment,setAssessment]=useState<Assessment|null>(null),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{void load()},[assessmentId]);
 async function load(){
  setLoading(true);setError("");
  const [a,aa,s]=await Promise.all([
   supabase.from("assessments").select("id,title,max_score,status,class_id,academic_year_id,school_id").eq("id",assessmentId).single(),
   supabase.from("assessment_variant_assignments").select("student_id,assessment_variant_id").eq("assessment_id",assessmentId),
   supabase.from("assessment_correction_sessions").select("id,student_id,assessment_variant_id,status,normalized_score,feedback").eq("assessment_id",assessmentId)
  ]);
  if(a.error||aa.error||s.error){setError((a.error||aa.error||s.error)!.message);setLoading(false);return}
  const ids=(aa.data??[]).map((x:VariantAssignment)=>x.student_id);
  if(!ids.length){setAssessment(a.data);setRows([]);setLoading(false);return}
  const st=await supabase.from("students").select("id,first_name,last_name,registration_number").in("id",ids).order("last_name");
  if(st.error){setError(st.error.message);setLoading(false);return}
  const amap=new Map((aa.data??[]).map((x:VariantAssignment)=>[x.student_id,x.assessment_variant_id]));
  const smap=new Map((s.data??[]).map((x:CorrectionSession)=>[x.student_id,x]));
  setAssessment(a.data);
  setRows((st.data??[]).map((student:Student)=>{
   const se=smap.get(student.id);
   return {student,variantId:amap.get(student.id)??null,sessionId:se?.id??null,status:se?.status??"draft",score:se?.normalized_score!=null?String(se.normalized_score):"",feedback:se?.feedback??""};
  }));
  setLoading(false);
 }
 function update(i:number,key:"score"|"feedback",value:string){setRows(r=>r.map((row,n)=>n===i?{...row,[key]:value}:row))}
 async function save(submit:boolean){
  if(!assessment)return;
  setSaving(true);setError("");setMessage("");
  for(const row of rows){
   if(row.status==="validated")continue;
   let sessionId=row.sessionId;
   if(!sessionId){
    const r=await supabase.from("assessment_correction_sessions").insert({school_id:assessment.school_id,assessment_id:assessmentId,student_id:row.student.id,assessment_variant_id:row.variantId,max_score:Number(assessment.max_score??20),normalized_score:row.score===""?null:Number(row.score),feedback:row.feedback||null,status:submit?"submitted":"draft"}).select("id").single();
    if(r.error){setError(r.error.message);setSaving(false);return}sessionId=r.data.id;
   }else{
    const r=await supabase.from("assessment_correction_sessions").update({normalized_score:row.score===""?null:Number(row.score),feedback:row.feedback||null,status:submit?"submitted":row.status}).eq("id",sessionId);
    if(r.error){setError(r.error.message);setSaving(false);return}
   }
  }
  setMessage(submit?"Corrections soumises.":"Corrections enregistrées.");
  setSaving(false);await load();
 }
 if(loading)return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-slate-500">Chargement…</main>;
 if(!assessment)return <main className="p-8 text-red-600">Évaluation introuvable.</main>;
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
  <button onClick={()=>router.push("/enseignant/corrections")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/> Corrections</button>
  <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-violet-700">Correction & notes</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{assessment.title}</h1><p className="mt-2 text-sm text-slate-500">Saisie rapide des notes finales · évaluation sur {assessment.max_score??20} · la correction reste entièrement à l&apos;appréciation de l&apos;enseignant.</p></div></header>
  {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
  {!rows.length?<div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Aucun élève n&apos;est encore associé à cette évaluation. Répartissez d&apos;abord les variantes depuis la page de l&apos;évaluation.</div>:
  <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
   <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Élève</th><th className="px-5 py-4">Matricule</th><th className="px-5 py-4">Note /{assessment.max_score??20}</th><th className="px-5 py-4">Appréciation</th><th className="px-5 py-4">Statut</th></tr></thead><tbody className="divide-y">{rows.map((r,i)=><tr key={r.student.id} className="hover:bg-slate-50/70"><td className="px-5 py-3 font-semibold text-slate-900">{r.student.last_name} {r.student.first_name}</td><td className="px-5 py-3 text-slate-500">{r.student.registration_number??"—"}</td><td className="px-5 py-3"><input inputMode="decimal" type="number" min="0" max={assessment.max_score??20} step="0.25" value={r.score} disabled={r.status==="validated"} onChange={e=>update(i,"score",e.target.value)} placeholder="—" className="w-28 rounded-lg border px-3 py-2 font-semibold focus:border-violet-500 focus:outline-none"/></td><td className="px-5 py-3"><input value={r.feedback} disabled={r.status==="validated"} onChange={e=>update(i,"feedback",e.target.value)} placeholder="Optionnel" className="min-w-64 rounded-lg border px-3 py-2"/></td><td className="px-5 py-3">{r.status==="validated"?<span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4"/> Validée</span>:<span className="text-slate-500">{r.status==="submitted"?"Soumise":"À saisir"}</span>}</td></tr>)}</tbody></table></div>
   <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4"><p className="text-xs text-slate-500">Aucune saisie par question : vous renseignez directement la note finale de chaque élève.</p><div className="flex gap-2"><button disabled={saving} onClick={()=>void save(false)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Enregistrer</button><button disabled={saving} onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4"/> Soumettre les corrections</button></div></div>
  </section>}
 </div></main>;
}
