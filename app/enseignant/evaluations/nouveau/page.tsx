"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, FileUp, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Assignment={id:string;class_subject_id:string;academic_year_id:string};
type CS={id:string;class_id:string;subject_id:string;academic_year_id:string};
type ClassRow={id:string;name:string;school_id:string;cycle_id:string;level_id:string;series_id:string|null;academic_year_id:string};
type Subject={id:string;name:string};
type Type={id:string;name:string;default_weight:number|null};
type Unit={id:string;title:string;unit_type:string;display_order:number};
type Program={id:string;name:string;subject_id:string;cycle_id:string;level_id:string;series_id:string|null};
type Version={id:string;version_number:number;name:string};

export default function NewEvaluation(){
 const router=useRouter();
 const [assignments,setAssignments]=useState<Assignment[]>([]),[classSubjects,setClassSubjects]=useState<CS[]>([]),[classes,setClasses]=useState<ClassRow[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[types,setTypes]=useState<Type[]>([]);
 const [classSubjectId,setClassSubjectId]=useState(""),[typeId,setTypeId]=useState(""),[title,setTitle]=useState(""),[date,setDate]=useState(""),[maxScore,setMaxScore]=useState("20"),[coefficient,setCoefficient]=useState("1"),[duration,setDuration]=useState(""),[mode,setMode]=useState<"ai"|"pdf">("ai"),[variantCount,setVariantCount]=useState("3"),[file,setFile]=useState<File|null>(null),[unitIds,setUnitIds]=useState<string[]>([]);
 const [program,setProgram]=useState<Program|null>(null),[version,setVersion]=useState<Version|null>(null),[units,setUnits]=useState<Unit[]>([]);
 const [loading,setLoading]=useState(true),[working,setWorking]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState<string|null>(null);

 useEffect(()=>{void load()},[]);
 async function load(){
  setLoading(true);setError(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/");return}
   const {data:u,error:ue}=await supabase.from("users").select("id").eq("auth_user_id",session.user.id).single();if(ue)throw ue;
   const {data:t,error:te}=await supabase.from("teachers").select("id").eq("user_id",u.id).maybeSingle();if(te)throw te;if(!t)throw new Error("Profil enseignant introuvable.");
   const [{data:ta,error:ae},{data:ty,error:ye}]=await Promise.all([
    supabase.from("teacher_assignments").select("id,class_subject_id,academic_year_id").eq("teacher_id",t.id).eq("status","active"),
    supabase.from("assessment_types").select("id,name,default_weight").eq("is_active",true).order("name")
   ]);
   if(ae)throw ae;if(ye)throw ye;
   const a=(ta??[]) as Assignment[];setAssignments(a);setTypes((ty??[]) as Type[]);
   if(!a.length)return;
   const [{data:cs,error:ce},{data:cl,error:cle}]=await Promise.all([
    supabase.from("class_subjects").select("id,class_id,subject_id,academic_year_id").in("id",a.map(x=>x.class_subject_id)),
    supabase.from("classes").select("id,name,school_id,cycle_id,level_id,series_id,academic_year_id").in("id",Array.from(new Set(a.map(x=>x.class_subject_id))))
   ]);
   if(ce)throw ce;if(cle)throw cle;
   const css=(cs??[]) as CS[];setClassSubjects(css);
   const classIds=Array.from(new Set(css.map(x=>x.class_id)));
   const {data:cls,error:cl2}=await supabase.from("classes").select("id,name,school_id,cycle_id,level_id,series_id,academic_year_id").in("id",classIds);if(cl2)throw cl2;
   setClasses((cls??[]) as ClassRow[]);
   const subjectIds=Array.from(new Set(css.map(x=>x.subject_id)));
   const {data:ss,error:se}=await supabase.from("subjects").select("id,name").in("id",subjectIds);if(se)throw se;setSubjects((ss??[]) as Subject[]);
   setTypeId((ty??[])[0]?.id??"");
  }catch(e){setError(e instanceof Error?e.message:"Impossible de charger le formulaire.");}finally{setLoading(false)}
 }
 const options=useMemo(()=>assignments.map(a=>{const cs=classSubjects.find(x=>x.id===a.class_subject_id);const cl=classes.find(x=>x.id===cs?.class_id);const s=subjects.find(x=>x.id===cs?.subject_id);return cs&&cl&&s?{a,cs,cl,s}:null}).filter(Boolean) as {a:Assignment;cs:CS;cl:ClassRow;s:Subject}[],[assignments,classSubjects,classes,subjects]);
 async function loadProgram(option:{cs:CS;cl:ClassRow;s:Subject}|null){
  setProgram(null);setVersion(null);setUnits([]);setUnitIds([]);
  if(!option)return;
  let pq=supabase.from("programs").select("id,name,subject_id,cycle_id,level_id,series_id").eq("school_id",option.cl.school_id).eq("cycle_id",option.cl.cycle_id).eq("level_id",option.cl.level_id).eq("subject_id",option.s.id).eq("status","active");
  pq=option.cl.series_id===null?pq.is("series_id",null):pq.eq("series_id",option.cl.series_id);
  const {data:p,error:pe}=await pq.maybeSingle();
  if(pe){setError(pe.message);return}
  if(!p){setError("Aucun programme actif ne correspond exactement à cette classe et cette matière.");return}
  setProgram(p as Program);
  const {data:v,error:ve}=await supabase.from("program_versions").select("id,version_number,name").eq("program_id",p.id).in("status",["published","draft"]).order("version_number",{ascending:false}).limit(1).maybeSingle();if(ve){setError(ve.message);return}if(!v)return;
  setVersion(v as Version);
  const {data:pa,error:pae}=await supabase.from("program_class_assignments").select("id").eq("program_version_id",v.id).eq("class_id",option.cl.id).eq("academic_year_id",option.cl.academic_year_id).eq("status","active").maybeSingle();if(pae){setError(pae.message);return}
  if(!pa){setError("Le programme n'est pas encore affecté à cette classe.");return}
  const {data:u,error:ue}=await supabase.from("program_units").select("id,title,unit_type,display_order").eq("program_version_id",v.id).order("display_order").order("created_at");if(ue)throw ue;
  setUnits((u??[]) as Unit[]);
 }
 async function createAssessment(){
  setWorking(true);setError(null);setMessage("");
  try{
   if(!classSubjectId||!typeId||!title.trim())throw new Error("Renseignez le titre, la classe/matière et le type d'évaluation.");
   const option=options.find(x=>x.cs.id===classSubjectId);if(!option)throw new Error("Affectation pédagogique invalide.");
   if(!program||!version)throw new Error("Aucun programme valide n'est associé à cette classe.");
   if(mode==="pdf"&&!file)throw new Error("Sélectionnez le PDF du sujet.");
   const count=mode==="ai"?Math.max(2,Math.min(10,Number(variantCount)||3)):1;
   const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Session expirée.");
   const {data:u,error:ue}=await supabase.from("users").select("id").eq("auth_user_id",user.id).single();if(ue)throw ue;
   const {data:t,error:te}=await supabase.from("teachers").select("id").eq("user_id",u.id).single();if(te)throw te;
   const type=types.find(x=>x.id===typeId);
   const {data:a,error:ae}=await supabase.from("assessments").insert({
     school_id:option.cl.school_id,teacher_id:t.id,class_id:option.cl.id,class_subject_id:option.cs.id,subject_id:option.s.id,
     academic_year_id:option.cl.academic_year_id,title:title.trim(),assessment_type_id:typeId,assessment_type:type?.name??null,
     coefficient:Number(coefficient)||1,max_score:Number(maxScore)||20,assessment_date:date||null,status:"draft",
     variant_count:count,variant_strategy:count>1?"random_per_student":"single"
   }).select("id").single();
   if(ae)throw ae;
   if(unitIds.length){
     const {error:le}=await supabase.from("assessment_subjects").insert(unitIds.map(program_unit_id=>({assessment_id:a.id,program_unit_id})));if(le)throw le;
   }
   if(mode==="pdf"){
     const path=`${option.cl.school_id}/${a.id}/A-${file!.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
     const up=await supabase.storage.from("assessment-subjects").upload(path,file!,{upsert:false,contentType:"application/pdf"});if(up.error)throw up.error;
     const {error:ve}=await supabase.from("assessment_variants").insert({assessment_id:a.id,variant_code:"A",variant_number:1,generation_method:"imported_pdf",status:"ready",title:title.trim(),subject_document_path:path,source_filename:file!.name,created_by:u.id});if(ve)throw ve;
     setMessage("Sujet PDF importé. Vous pouvez maintenant le soumettre au workflow de validation.");
   }else{
     const context={schoolId:option.cl.school_id,className:option.cl.name,subject:option.s.name,assessmentType:type?.name,maxScore:Number(maxScore)||20,coefficient:Number(coefficient)||1,durationMinutes:duration?Number(duration):null,program:program.name,programVersion:version.name,units:units.filter(x=>unitIds.includes(x.id)).map(x=>({id:x.id,title:x.title,type:x.unit_type}))};
     const ai=await supabase.functions.invoke("edusoft-ai-assessment",{body:{variantCount:count,context}});
     if(ai.error)throw ai.error;
     const result=ai.data as {variants?:Array<{code:string;title:string;subject:unknown;correction:unknown;total_points:number;warnings?:string[]}>;metadata?:{warnings?:string[]}};
     if(!result.variants?.length)throw new Error("EduSoft IA n'a renvoyé aucune variante.");
     const rows=result.variants.map((v,i)=>({assessment_id:a.id,variant_code:v.code||String.fromCharCode(65+i),variant_number:i+1,generation_method:"ai",status:"draft",title:v.title||`Sujet ${i+1}`,content:{subject:v.subject,total_points:v.total_points,warnings:v.warnings??[]},correction_content:{correction:v.correction},ai_generation_metadata:{model:"edusoft-ai",warnings:result.metadata?.warnings??[]},created_by:u.id}));
     const {error:ve}=await supabase.from("assessment_variants").insert(rows);if(ve)throw ve;
     setMessage(`${rows.length} variantes générées avec EduSoft IA, avec leurs corrigés séparés. Le sujet reste en brouillon jusqu'à votre soumission.`);
   }
   setTimeout(()=>router.push("/enseignant/evaluations"),900);
  }catch(e){setError(e instanceof Error?e.message:"Création impossible.");}finally{setWorking(false)}
 }
 if(loading)return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-slate-500">Chargement…</main>;
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-5xl space-y-6">
  <button onClick={()=>router.push("/enseignant/evaluations")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/> Mes évaluations</button>
  <header><p className="text-sm font-semibold text-violet-700">Nouveau sujet</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Créer une évaluation</h1><p className="mt-2 text-sm text-slate-500">Les classes et matières proposées viennent exclusivement de vos affectations officielles.</p></header>
  {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  {message&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
   <div className="grid gap-5 md:grid-cols-2">
    <Field label="Classe · matière"><select value={classSubjectId} onChange={e=>{setClassSubjectId(e.target.value);const o=options.find(x=>x.cs.id===e.target.value);void loadProgram(o??null)}} className="input"><option value="">Sélectionner</option>{options.map(x=><option key={x.cs.id} value={x.cs.id}>{x.cl.name} · {x.s.name}</option>)}</select></Field>
    <Field label="Type d'évaluation"><select value={typeId} onChange={e=>setTypeId(e.target.value)} className="input"><option value="">Sélectionner</option>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
    <Field label="Titre"><input value={title} onChange={e=>setTitle(e.target.value)} className="input" placeholder="Ex. Composition du 1er trimestre"/></Field>
    <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input"/></Field>
    <Field label="Note maximale"><input type="number" min="1" value={maxScore} onChange={e=>setMaxScore(e.target.value)} className="input"/></Field>
    <Field label="Coefficient"><input type="number" min="1" value={coefficient} onChange={e=>setCoefficient(e.target.value)} className="input"/></Field>
    <Field label="Durée (minutes)"><input type="number" min="1" value={duration} onChange={e=>setDuration(e.target.value)} className="input" placeholder="Ex. 120"/></Field>
   </div>
   {program&&<div className="rounded-xl bg-violet-50 p-4"><p className="text-sm font-semibold text-violet-900">Programme utilisé : {program.name} · {version?.name}</p><p className="mt-1 text-xs text-violet-700">Sélectionnez les unités réellement enseignées qui doivent servir de base au sujet.</p></div>}
   {units.length>0&&<div className="space-y-2"><p className="text-sm font-semibold text-slate-800">Unités du programme</p>{units.map(u=><label key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><input type="checkbox" checked={unitIds.includes(u.id)} onChange={e=>setUnitIds(v=>e.target.checked?[...v,u.id]:v.filter(id=>id!==u.id))}/><span><span className="block text-[10px] font-bold uppercase text-violet-600">{u.unit_type}</span><span className="text-sm text-slate-700">{u.title}</span></span></label>)}</div>}
   <div className="grid gap-3 md:grid-cols-2">
    <button type="button" onClick={()=>setMode("ai")} className={`rounded-2xl border p-5 text-left ${mode==="ai"?"border-violet-500 bg-violet-50":"border-slate-200"}`}><Bot className="h-5 w-5 text-violet-600"/><p className="mt-2 font-semibold text-slate-900">Générer avec EduSoft IA</p><p className="mt-1 text-sm text-slate-500">Crée plusieurs variantes équivalentes avec corrigés séparés.</p></button>
    <button type="button" onClick={()=>setMode("pdf")} className={`rounded-2xl border p-5 text-left ${mode==="pdf"?"border-violet-500 bg-violet-50":"border-slate-200"}`}><FileUp className="h-5 w-5 text-violet-600"/><p className="mt-2 font-semibold text-slate-900">Importer un PDF</p><p className="mt-1 text-sm text-slate-500">Le PDF original est conservé comme sujet importé.</p></button>
   </div>
   {mode==="ai"?<Field label="Nombre de variantes"><select value={variantCount} onChange={e=>setVariantCount(e.target.value)} className="input">{[2,3,4,5,6,8,10].map(n=><option key={n}>{n}</option>)}</select></Field>:<Field label="Sujet PDF"><input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]??null)} className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"/></Field>}
   <div className="flex justify-end pt-2"><button disabled={working} onClick={()=>void createAssessment()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}{working?"Création…":mode==="ai"?"Générer les sujets":"Importer le sujet"}</button></div>
  </section>
 </div></main>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>}
