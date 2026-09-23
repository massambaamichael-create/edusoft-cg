"use client";
import { useEffect,useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
type Row={id:string;student_id:string;assessment_id:string;status:string;normalized_score:number|null;feedback:string|null};
type StudentLookup={id:string;first_name:string;last_name:string};
type AssessmentLookup={id:string;title:string};
export default function CorrectionsPedagogie(){
 const [rows,setRows]=useState<Row[]>([]),[students,setStudents]=useState<Record<string,string>>({}),[assessments,setAssessments]=useState<Record<string,string>>({}),[comment,setComment]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{void load()},[]);
 async function load(){
  const r=await supabase.from("assessment_correction_sessions").select("id,student_id,assessment_id,status,normalized_score,feedback").in("status",["submitted","rejected"]).order("updated_at",{ascending:false});
  if(r.error){setMessage(r.error.message);return}setRows(r.data??[]);
  const si=(r.data??[]).map(x=>x.student_id),ai=(r.data??[]).map(x=>x.assessment_id);
  const [s,a]=await Promise.all([si.length?supabase.from("students").select("id,first_name,last_name").in("id",si):{data:[] as StudentLookup[]},ai.length?supabase.from("assessments").select("id,title").in("id",ai):{data:[] as AssessmentLookup[]}]);
  const sm:Record<string,string>={},am:Record<string,string>={};(s.data??[]).forEach((x:StudentLookup)=>sm[x.id]=x.last_name+" "+x.first_name);(a.data??[]).forEach((x:AssessmentLookup)=>am[x.id]=x.title);setStudents(sm);setAssessments(am);
 }
 async function act(id:string,to:string){
  setMessage("");const r=await supabase.rpc("transition_assessment_correction",{p_session_id:id,p_to_status:to,p_comment:comment.trim()||null});
  if(r.error)setMessage(r.error.message);else{setMessage(to==="validated"?"Correction validée : la note est maintenant inscrite dans grades.":"Correction rejetée et renvoyée au correcteur.");setComment("");await load()}
 }
 return <main className="min-h-full bg-[#F6F7FB] px-5 py-7 lg:px-10 lg:py-9"><div className="mx-auto max-w-7xl space-y-6">
  <header><p className="text-sm font-semibold text-violet-700">Pédagogie</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Corrections & notes</h1><p className="mt-2 text-sm text-slate-500">Validation des corrections avant alimentation officielle du registre des notes.</p></header>
  {message&&<div className="rounded-xl border bg-white p-4 text-sm">{message}</div>}
  <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Commentaire de validation ou motif de rejet (appliqué à l'action)" className="min-h-20 w-full max-w-3xl rounded-xl border bg-white p-3 text-sm"/>
  <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]">{!rows.length?<div className="p-10 text-center text-sm text-slate-500">Aucune correction en attente.</div>:rows.map(x=><div key={x.id} className="flex flex-col gap-4 border-b p-5 last:border-0 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-semibold">{assessments[x.assessment_id]??"Évaluation"}</p><p className="mt-1 text-sm text-slate-500">{students[x.student_id]??"Élève"} · {x.normalized_score??"—"} / 20 · {x.status}</p>{x.feedback&&<p className="mt-2 text-xs text-slate-400">{x.feedback}</p>}</div><div className="flex gap-2">{x.status==="submitted"&&<><button onClick={()=>void act(x.id,"validated")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4"/> Valider la note</button><button onClick={()=>void act(x.id,"rejected")} className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800"><XCircle className="h-4 w-4"/> Renvoyer</button></>}</div></div>)}</section>
 </div></main>;
}
