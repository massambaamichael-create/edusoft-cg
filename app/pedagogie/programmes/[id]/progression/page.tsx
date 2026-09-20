"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Program={id:string;name:string|null;cycle_id:string;level_id:string;series_id:string|null};
type Version={id:string;version_number:number;name:string};
type Unit={id:string;title:string;unit_type:string;display_order:number};
type ClassRow={id:string;name:string;cycle_id:string;level_id:string;series_id:string|null;academic_year_id:string};
type Year={id:string;name:string;is_active:boolean};
type Assignment={id:string;class_id:string;academic_year_id:string};
type TeacherAssignment={teacher_id:string;status:string;is_primary_teacher:boolean;teacher_name:string};
type Progress={program_unit_id:string;status:string;coverage_percent:number;taught_date:string|null};

export default function ProgressionPage(){
 const {id}=useParams<{id:string}>(); const router=useRouter(); const supabase=createClient();
 const [program,setProgram]=useState<Program|null>(null),[versions,setVersions]=useState<Version[]>([]),[versionId,setVersionId]=useState("");
 const [units,setUnits]=useState<Unit[]>([]),[classes,setClasses]=useState<ClassRow[]>([]),[years,setYears]=useState<Year[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]);
 const [yearId,setYearId]=useState(""),[classId,setClassId]=useState(""),[progress,setProgress]=useState<Record<string,Progress>>({});
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null),[teacherAssignments,setTeacherAssignments]=useState<TeacherAssignment[]>([]);

 useEffect(()=>{void loadBase()},[id]);
 async function loadBase(){
  setLoading(true);
  const r=await Promise.all([
   supabase.from("programs").select("id,name,cycle_id,level_id,series_id").eq("id",id).maybeSingle(),
   supabase.from("program_versions").select("id,version_number,name").eq("program_id",id).order("version_number",{ascending:false}),
   supabase.from("classes").select("id,name,cycle_id,level_id,series_id,academic_year_id").order("name"),
   supabase.from("academic_years").select("id,name,is_active").order("start_date",{ascending:false})
  ]);
  const e=r.find(x=>x.error)?.error;if(e){setError(e.message);setLoading(false);return}
  setProgram(r[0].data as Program|null);const v=(r[1].data??[]) as Version[];setVersions(v);setVersionId(v[0]?.id??"");
  const y=(r[3].data??[]) as Year[];setYears(y);setClasses((r[2].data??[]) as ClassRow[]);setYearId(y.find(x=>x.is_active)?.id??"");setLoading(false);
 }
 const compatible=useMemo(()=>classes.filter(c=>c.cycle_id===program?.cycle_id&&c.level_id===program?.level_id&&(program?.series_id?c.series_id===program.series_id:c.series_id==null)),[classes,program]);
 useEffect(()=>{if(versionId)void loadVersion()},[versionId]);
 async function loadVersion(){
  const [u,a]=await Promise.all([
   supabase.from("program_units").select("id,title,unit_type,display_order").eq("program_version_id",versionId).order("display_order"),
   supabase.from("program_class_assignments").select("id,class_id,academic_year_id").eq("program_version_id",versionId)
  ]);
  if(u.error||a.error){setError((u.error||a.error)!.message);return} setUnits((u.data??[]) as Unit[]);setAssignments((a.data??[]) as Assignment[]);
 }
 const assignment=assignments.find(a=>a.class_id===classId&&a.academic_year_id===yearId);
 useEffect(()=>{if(!classId||!yearId||!program){setTeacherAssignments([]);return}void loadTeachers()},[classId,yearId,program?.id]);
 async function loadTeachers(){
  const cs=await supabase.from("class_subjects").select("id").eq("class_id",classId).eq("subject_id",program!.subject_id).eq("academic_year_id",yearId).eq("is_active",true);
  if(cs.error){setError(cs.error.message);return}
  const ids=(cs.data??[]).map(x=>x.id);if(!ids.length){setTeacherAssignments([]);return}
  const ta=await supabase.from("teacher_assignments").select("teacher_id,status,is_primary_teacher").in("class_subject_id",ids).eq("academic_year_id",yearId).eq("status","active");
  if(ta.error){setError(ta.error.message);return}
  const teacherIds=(ta.data??[]).map(x=>x.teacher_id);if(!teacherIds.length){setTeacherAssignments([]);return}
  const tr=await supabase.from("teachers").select("id,user_id").in("id",teacherIds);
  if(tr.error){setError(tr.error.message);return}
  const userIds=(tr.data??[]).map(x=>x.user_id).filter(Boolean);const ur=userIds.length?await supabase.from("users").select("id,first_name,last_name").in("id",userIds):{data:[],error:null};
  if(ur.error){setError(ur.error.message);return}
  const userMap=Object.fromEntries((ur.data??[]).map(u=>[u.id,`${u.first_name??""} ${u.last_name??""}`.trim()]));
  const teacherUserMap=Object.fromEntries((tr.data??[]).map(t=>[t.id,userMap[t.user_id]||"Enseignant"]));
  setTeacherAssignments((ta.data??[]).map(t=>({...t,teacher_name:teacherUserMap[t.teacher_id]||"Enseignant"})) as TeacherAssignment[]);
 }
 useEffect(()=>{if(assignment)void loadProgress(assignment.id);else setProgress({})},[assignment?.id]);
 async function loadProgress(aid:string){const r=await supabase.from("progression_entries").select("program_unit_id,status,coverage_percent,taught_date").eq("program_class_assignment_id",aid);if(r.error)setError(r.error.message);else setProgress(Object.fromEntries(((r.data??[]) as Progress[]).map(p=>[p.program_unit_id,p])))}
 async function assign(){if(!versionId||!classId||!yearId)return;setSaving(true);const r=await supabase.from("program_class_assignments").insert({program_version_id:versionId,class_id:classId,academic_year_id:yearId,status:"active"});if(r.error&&r.error.code!=="23505")setError(r.error.message);await loadVersion();setSaving(false)}
 async function save(unit:Unit,patch:Partial<Progress>){if(!assignment)return;setSaving(true);const old=progress[unit.id]??{program_unit_id:unit.id,status:"planned",coverage_percent:0,taught_date:null};const r=await supabase.from("progression_entries").upsert({program_class_assignment_id:assignment.id,program_unit_id:unit.id,status:patch.status??old.status,coverage_percent:patch.coverage_percent??old.coverage_percent,taught_date:patch.taught_date??old.taught_date},{onConflict:"program_class_assignment_id,program_unit_id"}).select("program_unit_id,status,coverage_percent,taught_date").single();if(r.error)setError(r.error.message);else if(r.data)setProgress(p=>({...p,[unit.id]:r.data as Progress}));setSaving(false)}
 if(loading)return <main className="p-8 text-sm">Chargement…</main>;
 if(!program)return <main className="p-8"><button onClick={()=>router.back()}>← Retour</button><p className="mt-6">Programme introuvable.</p></main>;
 const coverage=units.length?Math.round(units.reduce((n,u)=>n+(progress[u.id]?.coverage_percent??0),0)/units.length):0;
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8">
  <button onClick={()=>router.push("/pedagogie/programmes/"+id)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4"/> Programme</button>
  <header className="mb-6"><h1 className="text-2xl font-bold text-slate-950">Progression — {program.name||"Programme"}</h1><p className="mt-1 text-sm text-slate-500">Suivi par classe et année scolaire.</p></header>
  {error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
   <div className="grid gap-4 md:grid-cols-3">
    <select className="input" value={versionId} onChange={e=>setVersionId(e.target.value)}><option value="">Version</option>{versions.map(v=><option key={v.id} value={v.id}>V{v.version_number} · {v.name}</option>)}</select>
    <select className="input" value={yearId} onChange={e=>setYearId(e.target.value)}><option value="">Année scolaire</option>{years.map(y=><option key={y.id} value={y.id}>{y.name}{y.is_active?" · active":""}</option>)}</select>
    <select className="input" value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Classe compatible</option>{compatible.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
   </div>
   <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Enseignant affecté à cette matière</p><div className="mt-1 text-sm font-semibold text-slate-800">{teacherAssignments.length?teacherAssignments.map(t=>t.teacher_name).join(", "):"Aucune affectation officielle active"}</div></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${teacherAssignments.length?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{teacherAssignments.length?"Affectation trouvée":"À affecter"}</span></div></div>
   <div className="mt-4 flex items-center justify-between"><div><span className="text-xs text-slate-500">Couverture</span><div className="text-2xl font-bold">{coverage}%</div></div><button disabled={!classId||!yearId||!versionId||!!assignment||saving} onClick={assign} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><CheckCircle2 className="h-4 w-4"/>{assignment?"Programme affecté":"Affecter à la classe"}</button></div>
  </section>
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   {units.map(u=>{const p=progress[u.id]??{status:"planned",coverage_percent:0,taught_date:null};return <div key={u.id} className="border-b border-slate-100 p-5"><div className="flex items-center gap-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold">{u.display_order+1}</div><div className="flex-1"><div className="flex gap-2"><span className="text-[10px] font-bold uppercase text-violet-600">{u.unit_type}</span><span className="font-semibold">{u.title}</span></div><div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr_150px]"><select disabled={!assignment||saving} className="input" value={p.status} onChange={e=>void save(u,{status:e.target.value})}><option value="planned">Prévu</option><option value="in_progress">En cours</option><option value="taught">Enseigné</option><option value="reinforcement">À renforcer</option><option value="not_applicable">Non applicable</option></select><label className="flex items-center gap-3"><input disabled={!assignment||saving} type="range" min="0" max="100" value={p.coverage_percent} onChange={e=>void save(u,{coverage_percent:Number(e.target.value)})} className="w-full"/><span className="w-12 text-sm font-semibold">{p.coverage_percent}%</span></label><span className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-4 w-4"/>{p.taught_date?"Enseigné":"Non enseigné"}</span></div></div></div></div>})}
   {units.length===0&&<div className="p-12 text-center text-sm text-slate-500">Aucune unité dans cette version.</div>}
  </section>
  <style jsx>{".input{width:100%;border-radius:.75rem;border:1px solid rgb(226 232 240);background:white;padding:.625rem .875rem;font-size:.875rem;outline:none}"}</style>
 </main>
}