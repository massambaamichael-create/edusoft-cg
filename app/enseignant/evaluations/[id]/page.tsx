"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, FileText, Loader2, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Assessment={id:string;title:string;status:string;variant_count:number;assessment_date:string|null;max_score:number|null;coefficient:number|null;teacher_id:string|null;class_id:string|null;class_subject_id:string|null;subject_id:string|null};
type Variant={id:string;variant_code:string;variant_number:number;generation_method:string;status:string;title:string|null;content:any;correction_content:any;subject_document_path:string|null;source_filename:string|null};

export default function EvaluationDetail(){
 const {id}=useParams<{id:string}>();const router=useRouter();
 const [a,setA]=useState<Assessment|null>(null),[variants,setVariants]=useState<Variant[]>([]),[loading,setLoading]=useState(true),[working,setWorking]=useState(false),[showCorrection,setShowCorrection]=useState<Record<string,boolean>>({}),[error,setError]=useState<string|null>(null),[message,setMessage]=useState("");
 useEffect(()=>{void load()},[id]);
 async function load(){
  setLoading(true);setError(null);
  const [{data:a1,error:ae},{data:v,error:ve}]=await Promise.all([
   supabase.from("assessments").select("id,title,status,variant_count,assessment_date,max_score,coefficient,teacher_id,class_id,class_subject_id,subject_id").eq("id",id).single(),
   supabase.from("assessment_variants").select("id,variant_code,variant_number,generation_method,status,title,content,correction_content,subject_document_path,source_filename").eq("assessment_id",id).order("variant_number")
  ]);
  if(ae)setError(ae.message);else setA(a1 as Assessment);
  if(ve)setError(ve.message);else setVariants((v??[]) as Variant[]);
  setLoading(false);
 }
 async function submit(){
  setWorking(true);setError(null);setMessage("");
  const {data,error}=await supabase.rpc("transition_assessment_workflow",{p_assessment_id:id,p_to_status:"submitted",p_comment:null});
  if(error)setError(error.message);else{setA(data as Assessment);setMessage("Sujet soumis. Il est maintenant disponible pour le responsable de matière et la validation pédagogique.");}
  setWorking(false);
 }
 async function distribute(){
  setWorking(true);setError(null);setMessage("");
  const {data,error}=await supabase.rpc("distribute_assessment_variants",{p_assessment_id:id});
  if(error)setError(error.message);else setMessage(`${data} élève(s) ont reçu une variante selon une répartition équilibrée aléatoire.`);
  setWorking(false);
 }
 async function openPdf(path:string){
  const {data,error}=await supabase.storage.from("assessment-subjects").createSignedUrl(path,3600);
  if(error){setError(error.message);return}
  window.open(data.signedUrl,"_blank","noopener,noreferrer");
 }
 const pretty=(value:any)=>typeof value==="string"?value:JSON.stringify(value,null,2);
 if(loading)return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-slate-500">Chargement…</main>;
 if(!a)return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-red-600">Évaluation introuvable.</main>;
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
  <button onClick={()=>router.push("/enseignant/evaluations")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/> Mes évaluations</button>
  <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-violet-700">Sujet</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{a.title}</h1><p className="mt-2 text-sm text-slate-500">{a.variant_count} variante{a.variant_count>1?"s":""} · /{a.max_score??20} · coefficient {a.coefficient??1}</p></div>
   {["approved","scheduled","published","completed"].includes(a.status)&&<button onClick={()=>router.push("/enseignant/corrections/"+id)} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700">Corriger & saisir les notes</button>}{a.status==="draft"||a.status==="changes_requested"?<button disabled={working||!variants.length} onClick={()=>void submit()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Soumettre à la validation</button>:a.variant_count>1&&["approved","scheduled","published"].includes(a.status)?<button disabled={working} onClick={()=>void distribute()} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 disabled:opacity-50">{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Répartir les variantes</button>:<span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{a.status}</span>}
  </header>
  {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
  <div className="grid gap-5 md:grid-cols-2">{variants.map(v=><article key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
   <div className="flex items-center justify-between"><div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">Version {v.variant_code}</span><p className="mt-3 font-bold text-slate-900">{v.title??"Sujet"}</p></div><span className="text-xs text-slate-400">{v.generation_method==="ai"?"EduSoft IA":"PDF importé"}</span></div>
   {v.subject_document_path?<button onClick={()=>void openPdf(v.subject_document_path!)} className="mt-5 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700"><FileText className="h-4 w-4"/> Ouvrir le PDF original</button>:<pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-700">{pretty(v.content?.subject??v.content)}</pre>}
   {v.correction_content&&<div className="mt-4"><button onClick={()=>setShowCorrection(x=>({...x,[v.id]:!x[v.id]}))} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700"><Eye className="h-4 w-4"/>{showCorrection[v.id]?"Masquer le corrigé":"Afficher le corrigé"}</button>{showCorrection[v.id]&&<pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-amber-50 p-4 text-xs leading-5 text-slate-700">{pretty(v.correction_content?.correction??v.correction_content)}</pre>}</div>}
   <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4"/> Statut : {v.status}</div>
  </article>)}</div>
 </div></main>
