"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string; school_id: string; teacher_id: string; subject_id: string;
  cycle_id: string; level_id: string | null; series_id: string | null;
  academic_year_id: string; is_active: boolean;
};
type Item = { id: string; name: string; cycle_id?: string; level_id?: string | null; series_id?: string | null };
type Teacher = Item & { user_id: string | null };
type UserRow = { id: string; first_name: string | null; last_name: string | null; email: string | null };

export default function PedagogicalResponsibilitiesPage() {
  const [schoolId,setSchoolId]=useState(""); const [yearId,setYearId]=useState("");
  const [years,setYears]=useState<Item[]>([]); const [cycles,setCycles]=useState<Item[]>([]);
  const [levels,setLevels]=useState<Item[]>([]); const [series,setSeries]=useState<Item[]>([]);
  const [subjects,setSubjects]=useState<Item[]>([]); const [teachers,setTeachers]=useState<Teacher[]>([]);
  const [classes,setClasses]=useState<Item[]>([]); const [responsibilities,setResponsibilities]=useState<Row[]>([]);
  const [principalByClass,setPrincipalByClass]=useState<Record<string,string>>({});
  const [cycleId,setCycleId]=useState(""); const [levelId,setLevelId]=useState(""); const [seriesId,setSeriesId]=useState("");
  const [subjectId,setSubjectId]=useState(""); const [teacherId,setTeacherId]=useState("");
  const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");

  const teacherName=(id:string)=>teachers.find(t=>t.id===id)?.name || "Enseignant";
  const cycleName=(id:string)=>cycles.find(x=>x.id===id)?.name || "";
  const levelName=(id:string|null)=>levels.find(x=>x.id===id)?.name || "Tous les niveaux";
  const seriesName=(id:string|null)=>series.find(x=>x.id===id)?.name || "Toutes les séries/filières";
  const subjectName=(id:string)=>subjects.find(x=>x.id===id)?.name || "";
  const filteredLevels=useMemo(()=>levels.filter(x=>!cycleId||x.cycle_id===cycleId),[levels,cycleId]);
  const filteredSeries=useMemo(()=>series.filter(x=>!cycleId||x.cycle_id===cycleId),[series,cycleId]);
  const filteredClasses=useMemo(()=>classes.filter(x=>!cycleId||x.cycle_id===cycleId).filter(x=>!levelId||x.level_id===levelId).filter(x=>!seriesId||x.series_id===seriesId),[classes,cycleId,levelId,seriesId]);

  const load=async()=>{
    setMessage("");
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
    const {data:profile}=await supabase.from("users").select("id,school_id").eq("auth_user_id",user.id).single(); if(!profile)return;
    setSchoolId(profile.school_id);
    const [y,c,l,s,sub,t,cl]=await Promise.all([
      supabase.from("academic_years").select("id,name,is_active").eq("school_id",profile.school_id).order("start_date",{ascending:false}),
      supabase.from("cycles").select("id,name").eq("school_id",profile.school_id).order("created_at"),
      supabase.from("levels").select("id,name,cycle_id").eq("school_id",profile.school_id).order("display_order"),
      supabase.from("series").select("id,name,cycle_id").eq("school_id",profile.school_id).order("name"),
      supabase.from("subjects").select("id,name").eq("school_id",profile.school_id).order("name"),
      supabase.from("teachers").select("id,user_id").eq("school_id",profile.school_id),
      supabase.from("classes").select("id,name,cycle_id,level_id,series_id").eq("school_id",profile.school_id).order("name")
    ]);
    const trs=t.data||[]; const ids=trs.map(x=>x.user_id).filter((id): id is string => Boolean(id)); let us:UserRow[]=[];
    if(ids.length){const {data}=await supabase.from("users").select("id,first_name,last_name,email").in("id",ids);us=(data||[]) as UserRow[];}
    setYears(y.data||[]); setCycles(c.data||[]); setLevels(l.data||[]); setSeries(s.data||[]); setSubjects(sub.data||[]);
    setTeachers(trs.map(x=>{const u=us.find(v=>v.id===x.user_id);return {id:x.id,user_id:x.user_id,name:[u?.first_name,u?.last_name].filter(Boolean).join(" ")||u?.email||x.id.slice(0,8)};}));
    setClasses(cl.data||[]);
    const active=(y.data||[]).find(x=>x.is_active)||(y.data||[])[0]; const next=yearId||active?.id||""; setYearId(next);
    if(next){
      const [r,cc]=await Promise.all([
        supabase.from("subject_responsibilities").select("*").eq("school_id",profile.school_id).eq("academic_year_id",next).eq("is_active",true),
        supabase.from("classes").select("id,principal_teacher_id").eq("school_id",profile.school_id).eq("academic_year_id",next)
      ]);
      setResponsibilities(r.data||[]); const map:Record<string,string>={}; (cc.data||[]).forEach(x=>map[x.id]=x.principal_teacher_id||""); setPrincipalByClass(map);
    }
  };
  // Initial data load is intentionally triggered on mount.\n  useEffect(()=>{load();},[]);
  // Refresh when the selected academic year changes.\n  useEffect(()=>{if(schoolId&&yearId)load();},[yearId]);

  const savePrincipal=async(id:string,teacher:string)=>{
    setSaving(true);setMessage("");
    const {error}=await supabase.from("classes").update({principal_teacher_id:teacher||null}).eq("id",id).eq("school_id",schoolId).eq("academic_year_id",yearId);
    setSaving(false); if(error)setMessage(error.message); else {setPrincipalByClass(v=>({...v,[id]:teacher}));setMessage("Professeur principal enregistré.");}
  };
  const saveResponsibility=async()=>{
    if(!schoolId||!yearId||!cycleId||!subjectId||!teacherId){setMessage("Sélectionnez au minimum l'année, le cycle, la matière et l'enseignant.");return;}
    setSaving(true);setMessage("");
    const {error}=await supabase.from("subject_responsibilities").upsert({
      school_id:schoolId,academic_year_id:yearId,teacher_id:teacherId,subject_id:subjectId,cycle_id:cycleId,
      level_id:levelId||null,series_id:seriesId||null,responsibility_type:"subject_manager",is_active:true
    },{onConflict:"school_id,academic_year_id,subject_id,cycle_id,level_id,series_id"});
    setSaving(false);if(error)setMessage(error.message);else{setMessage("Responsable de matière enregistré.");await load();}
  };
  const removeResponsibility=async(id:string)=>{
    setSaving(true);const {error}=await supabase.from("subject_responsibilities").update({is_active:false}).eq("id",id).eq("school_id",schoolId);
    setSaving(false);if(error)setMessage(error.message);else await load();
  };

  return <main className="min-h-screen bg-slate-50 p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <div><p className="text-sm font-semibold text-indigo-700">Pédagogie</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Responsabilités pédagogiques</h1><p className="mt-2 text-sm text-slate-500">Désignez les professeurs principaux des classes et les responsables de matière. Ces responsabilités ne remplacent pas les affectations d'enseignement.</p></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><label className="text-sm font-semibold text-slate-700">Année scolaire</label><select value={yearId} onChange={e=>setYearId(e.target.value)} className="mt-2 w-full max-w-sm rounded-xl border px-3 py-2">{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
    {message&&<div className="rounded-xl border bg-white p-4 text-sm text-slate-700">{message}</div>}
    <section className="rounded-2xl border bg-white shadow-sm"><div className="flex items-center gap-3 border-b p-5"><UsersRound className="h-5 w-5 text-indigo-600"/><div><h2 className="font-semibold text-slate-900">Professeurs principaux</h2><p className="text-sm text-slate-500">Une responsabilité au niveau de la classe.</p></div></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-slate-500"><th className="p-4">Classe</th><th className="p-4">Contexte</th><th className="p-4">Professeur principal</th></tr></thead><tbody>
        {filteredClasses.map(c=><tr key={c.id} className="border-b last:border-0"><td className="p-4 font-medium">{c.name}</td><td className="p-4">{cycleName(c.cycle_id)} · {levelName(c.level_id)}{c.series_id ? " · "+seriesName(c.series_id):""}</td><td className="p-4"><select disabled={saving} value={principalByClass[c.id]||""} onChange={e=>savePrincipal(c.id,e.target.value)} className="w-full max-w-sm rounded-xl border px-3 py-2"><option value="">Aucun</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></td></tr>)}
      </tbody></table></div>
    </section>
    <section className="rounded-2xl border bg-white shadow-sm"><div className="flex items-center gap-3 border-b p-5"><BookOpen className="h-5 w-5 text-indigo-600"/><div><h2 className="font-semibold text-slate-900">Responsables de matière</h2><p className="text-sm text-slate-500">Responsabilité par matière et contexte, avec ciblage possible du niveau ou de la série/filière.</p></div></div>
      <div className="grid gap-4 p-5 md:grid-cols-5">
        <select value={cycleId} onChange={e=>{setCycleId(e.target.value);setLevelId("");setSeriesId("");}} className="rounded-xl border px-3 py-2"><option value="">Cycle</option>{cycles.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={levelId} onChange={e=>setLevelId(e.target.value)} className="rounded-xl border px-3 py-2"><option value="">Tous les niveaux</option>{filteredLevels.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={seriesId} onChange={e=>setSeriesId(e.target.value)} className="rounded-xl border px-3 py-2"><option value="">Toutes les séries/filières</option>{filteredSeries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={subjectId} onChange={e=>setSubjectId(e.target.value)} className="rounded-xl border px-3 py-2"><option value="">Matière</option>{subjects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={teacherId} onChange={e=>setTeacherId(e.target.value)} className="rounded-xl border px-3 py-2"><option value="">Responsable</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button disabled={saving} onClick={saveResponsibility} className="md:col-span-5 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4"/>Enregistrer la responsabilité</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-slate-500"><th className="p-4">Matière</th><th className="p-4">Contexte</th><th className="p-4">Responsable</th><th className="p-4"></th></tr></thead><tbody>
        {responsibilities.map(r=><tr key={r.id} className="border-b last:border-0"><td className="p-4 font-medium">{subjectName(r.subject_id)}</td><td className="p-4">{cycleName(r.cycle_id)} · {levelName(r.level_id)}{r.series_id ? " · "+seriesName(r.series_id):""}</td><td className="p-4">{teacherName(r.teacher_id)}</td><td className="p-4 text-right"><button disabled={saving} onClick={()=>removeResponsibility(r.id)} className="font-semibold text-rose-600">Retirer</button></td></tr>)}
        {!responsibilities.length&&<tr><td colSpan={4} className="p-8 text-center text-slate-500">Aucun responsable de matière pour cette année.</td></tr>}
      </tbody></table></div>
    </section>
  </div></main>;
}
