"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Save, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Student={id:string;first_name:string;last_name:string;registration_number:string|null};
type QuestionLike={id?:string|number;key?:string;number?:number;title?:string;text?:string;question?:string;points?:number;max_score?:number;maxPoints?:number};
type ContentShape={questions?:QuestionLike[]} | QuestionLike[] | null | undefined;
type Variant={id:string;variant_code:string;content:ContentShape;correction_content:ContentShape};
type Assignment={student_id:string;assessment_variant_id:string};
type Session={id:string;student_id:string;assessment_variant_id:string|null;status:string;total_score:number;max_score:number;normalized_score:number|null;feedback:string|null};
type Item={id?:string;question_key:string;question_label:string;awarded_score:number;max_score:number;student_answer:string;teacher_comment:string;display_order:number};

function questionsFromContent(content:ContentShape):Item[]{
 const qs:QuestionLike[]=Array.isArray(content)&&!("questions" in (content as object))?content as QuestionLike[]:Array.isArray((content as {questions?:QuestionLike[]})?.questions)?(content as {questions:QuestionLike[]}).questions:[];
 return qs.map((q,i)=>({question_key:String(q?.id??q?.key??q?.number??i+1),question_label:String(q?.title??q?.text??q?.question??("Question "+(i+1))),awarded_score:0,max_score:Number(q?.points??q?.max_score??q?.maxPoints??0)||0,student_answer:"",teacher_comment:"",display_order:i}));
}

export default function CorrectionsPage(){
 const {id}=useParams<{id:string}>();const router=useRouter();
 const [assessment,setAssessment]=useState<{id:string;title:string;max_score:number|null;status:string;class_id:string;academic_year_id:string;school_id:string}|null>(null),[students,setStudents]=useState<Student[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[variants,setVariants]=useState<Variant[]>([]),[sessions,setSessions]=useState<Session[]>([]),[items,setItems]=useState<Item[]>([]),[selected,setSelected]=useState<string|null>(null),[feedback,setFeedback]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{void load()},[id]);
 async function load(){
  setLoading(true);setError("");
  const [ar,vr,aa]=await Promise.all([
   supabase.from("assessments").select("id,title,max_score,status,class_id,academic_year_id,school_id").eq("id",id).single(),
   supabase.from("assessment_variants").select("id,variant_code,content,correction_content").eq("assessment_id",id).order("variant_number"),
   supabase.from("assessment_variant_assignments").select("student_id,assessment_variant_id").eq("assessment_id",id)
  ]);
  if(ar.error||vr.error||aa.error){setError((ar.error||vr.error||aa.error)!.message);setLoading(false);return}
  const ids=(aa.data??[]).map((x:Assignment)=>x.student_id);let st:Student[]=[];
  if(ids.length){const r=await supabase.from("students").select("id,first_name,last_name,registration_number").in("id",ids).order("last_name");if(r.error){setError(r.error.message);setLoading(false);return}st=(r.data??[]) as Student[]}
  const sr=await supabase.from("assessment_correction_sessions").select("id,student_id,assessment_variant_id,status,total_score,max_score,normalized_score,feedback").eq("assessment_id",id);
  if(sr.error){setError(sr.error.message);setLoading(false);return}
  setAssessment(ar.data);setVariants((vr.data??[]) as Variant[]);setAssignments((aa.data??[]) as Assignment[]);setStudents(st);setSessions((sr.data??[]) as Session[]);setSelected(st[0]?.id??null);setLoading(false);
 }
 const currentStudent=students.find(s=>s.id===selected);
 const currentAssignment=assignments.find(a=>a.student_id===selected);
 const currentVariant=variants.find(v=>v.id===currentAssignment?.assessment_variant_id)??variants[0];
 const currentSession=sessions.find(s=>s.student_id===selected);
 const baseItems=useMemo(()=>currentVariant?questionsFromContent(currentVariant.content):[],[currentVariant]);
 useEffect(()=>{void prepare()},[selected,currentVariant?.id,currentSession?.id]);
 async function prepare(){
  if(!selected||!currentVariant)return;
  if(currentSession){const r=await supabase.from("assessment_correction_items").select("id,question_key,question_label,awarded_score,max_score,student_answer,teacher_comment,display_order").eq("correction_session_id",currentSession.id).order("display_order");setItems(!r.error&&r.data?.length?r.data as Item[]:baseItems);setFeedback(currentSession.feedback??"")}
  else{setItems(baseItems);setFeedback("")}
 }
 function updateItem(i:number,key:keyof Item,value:string|number){setItems(x=>x.map((it,n)=>n===i?{...it,[key]:value}:it))}
 async function save(submit:boolean){
  if(!selected||!currentVariant||!assessment)return;
  setSaving(true);setError("");setMessage("");
  let session=currentSession;
  if(!session){
   const r=await supabase.from("assessment_correction_sessions").insert({school_id:assessment.school_id,assessment_id:id,student_id:selected,assessment_variant_id:currentVariant.id,max_score:Number(assessment.max_score??20)}).select("id,student_id,assessment_variant_id,status,total_score,max_score,normalized_score,feedback").single();
   if(r.error){setError(r.error.message);setSaving(false);return}session=r.data as Session;
  }
  const payload=items.map((it,n)=>({correction_session_id:session!.id,question_key:it.question_key,question_label:it.question_label,awarded_score:Math.min(Math.max(Number(it.awarded_score)||0,0),Number(it.max_score)||0),max_score:Number(it.max_score)||0,student_answer:it.student_answer,teacher_comment:it.teacher_comment,display_order:n}));
  const ir=await supabase.from("assessment_correction_items").upsert(payload,{onConflict:"correction_session_id,question_key"});
  if(ir.error){setError(ir.error.message);setSaving(false);return}
  const rr=await supabase.rpc("recalculate_assessment_correction",{p_session_id:session!.id});
  if(rr.error){setError(rr.error.message);setSaving(false);return}
  if(submit){const tr=await supabase.rpc("transition_assessment_correction",{p_session_id:session!.id,p_to_status:"submitted",p_comment:feedback.trim()||null});if(tr.error){setError(tr.error.message);setSaving(false);return}setMessage("Correction enregistrée et soumise pour validation.")}
  else setMessage("Correction enregistrée.");
  setSaving(false);await load();
 }
 const canEdit=currentSession?.status===undefined||currentSession?.status==="draft"||currentSession?.status==="rejected";\n const label=(s:string)=>({draft:"Brouillon",submitted:"Soumise",validated:"Validée",rejected:"À reprendre"} as Record<string,string>)[s]??s;
 if(loading)return <main className="min-h-screen bg-[#F6F7FB] p-8 text-sm text-slate-500">Chargement…</main>;
 if(!assessment)return <main className="p-8 text-red-600">Évaluation introuvable.</main>;
 return <main className="min-h-screen bg-[#F6F7FB] p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
  <button onClick={()=>router.push("/enseignant/evaluations/"+id)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/> Évaluation</button>
  <header><p className="text-sm font-semibold text-slate-700">Correction & notes</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{assessment.title}</h1><p className="mt-2 text-sm text-slate-500">Correction question par question · note normalisée sur 20 · validation humaine avant inscription officielle de la note.</p></header>
  {error&&<div className="rounded-[18px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message&&<div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
  <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
   <aside className="rounded-[24px] border bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"><h2 className="font-bold text-slate-900">Élèves ({students.length})</h2><div className="mt-3 space-y-1">{students.map(s=>{const se=sessions.find(x=>x.student_id===s.id);return <button key={s.id} onClick={()=>setSelected(s.id)} className={"w-full rounded-[18px] p-3 text-left "+(selected===s.id?"bg-slate-100 text-slate-900":"hover:bg-slate-50")}><div className="flex items-center justify-between"><span className="font-semibold">{s.last_name} {s.first_name}</span>{se?.status==="validated"&&<CheckCircle2 className="h-4 w-4 text-emerald-600"/>}</div><p className="mt-1 text-xs text-slate-400">{s.registration_number??"Matricule —"} · {se?label(se.status):"Non corrigé"}</p></button>})}</div></aside>
   <section className="rounded-[24px] border bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">{!currentStudent?<p className="text-sm text-slate-500">Aucun élève à corriger. Répartissez d'abord les variantes depuis l'évaluation.</p>:<>
    <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-bold">{currentStudent.last_name} {currentStudent.first_name}</h2><p className="text-sm text-slate-500">Variante {currentVariant?.variant_code??"—"} · {currentSession?label(currentSession.status):"Brouillon"}</p></div><div className="text-right"><p className="text-xs text-slate-400">Note</p><p className="text-2xl font-bold text-slate-700">{currentSession?.normalized_score??"—"} / 20</p></div></div>
    <div className="mt-5 space-y-4">{items.length?items.map((it,i)=><div key={it.question_key} className="rounded-[18px] border border-slate-200 p-4"><div className="flex justify-between gap-4"><p className="font-semibold text-slate-900">{it.question_label}</p><span className="text-xs text-slate-400">/{it.max_score}</span></div><textarea value={it.student_answer} disabled={!canEdit} onChange={e=>updateItem(i,"student_answer",e.target.value)} placeholder="Réponse / observation de la copie" className="mt-3 min-h-20 w-full rounded-lg border p-3 text-sm"/><div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr]"><input type="number" min="0" max={it.max_score} step="0.25" value={it.awarded_score} disabled={!canEdit} onChange={e=>updateItem(i,"awarded_score",e.target.value)} className="rounded-lg border p-2.5 text-sm"/><input value={it.teacher_comment} disabled={!canEdit} onChange={e=>updateItem(i,"teacher_comment",e.target.value)} placeholder="Commentaire du correcteur" className="rounded-lg border p-2.5 text-sm"/></div></div>):<div className="rounded-[18px] bg-slate-50 p-5 text-sm text-slate-500">Le sujet ne contient pas de questions structurées. Ajoutez des questions structurées dans le sujet IA pour activer la correction détaillée.</div>}</div>
    <textarea value={feedback} disabled={!canEdit} onChange={e=>setFeedback(e.target.value)} placeholder="Appréciation générale de la copie" className="mt-5 min-h-24 w-full rounded-[18px] border p-3 text-sm"/>
    <div className="mt-5 flex flex-wrap gap-2"><button disabled={saving||!canEdit} onClick={()=>void save(false)} className="inline-flex items-center gap-2 rounded-[18px] border px-4 py-2.5 text-sm font-semibold"><Save className="h-4 w-4"/> Enregistrer</button><button disabled={saving||!canEdit} onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-[18px] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Soumettre la correction</button></div>
   </>}</section>
  </div>
 </div></main>;
}
