"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ClipboardList, GraduationCap, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Assignment = { id:string; class_subject_id:string; academic_year_id:string; status:string };
type ClassSubject = { id:string; class_id:string; subject_id:string; academic_year_id:string };
type SchoolClass = { id:string; name:string; cycle_id:string; level_id:string; series_id:string|null; academic_year_id:string };
type Subject = { id:string; name:string };
type Program = { id:string; name:string; code:string|null; cycle_id:string; level_id:string; series_id:string|null; subject_id:string; status:string };

export default function EnseignantHome(){
  const router=useRouter();
  const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const [rows,setRows]=useState<{assignment:Assignment;classRow:SchoolClass;subject:Subject;program?:Program}[]>([]);

  // eslint-disable-next-line react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(()=>{void load()},[]);
  async function load(){
    setLoading(true);setError(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){router.replace("/");return}
      const {data:user,error:ue}=await supabase.from("users").select("id").eq("auth_user_id",session.user.id).single();
      if(ue)throw ue;
      const {data:teacher,error:te}=await supabase.from("teachers").select("id").eq("user_id",user.id).maybeSingle();
      if(te)throw te;
      if(!teacher){setRows([]);return}

      const {data:tas,error:ae}=await supabase.from("teacher_assignments").select("id,class_subject_id,academic_year_id,status").eq("teacher_id",teacher.id).eq("status","active");
      if(ae)throw ae;
      const assignments=(tas??[]) as Assignment[];
      if(!assignments.length){setRows([]);return}

      const {data:css,error:ce}=await supabase.from("class_subjects").select("id,class_id,subject_id,academic_year_id").in("id",assignments.map(x=>x.class_subject_id));
      if(ce)throw ce;
      const classSubjects=(css??[]) as ClassSubject[];
      const classIds=[...new Set(classSubjects.map(x=>x.class_id))],subjectIds=[...new Set(classSubjects.map(x=>x.subject_id))];
      const [{data:classes,error:cle},{data:subjects,error:se},{data:programs,error:pe}]=await Promise.all([
        supabase.from("classes").select("id,name,cycle_id,level_id,series_id,academic_year_id").in("id",classIds),
        supabase.from("subjects").select("id,name").in("id",subjectIds),
        supabase.from("programs").select("id,name,code,cycle_id,level_id,series_id,subject_id,status").in("subject_id",subjectIds)
      ]);
      if(cle)throw cle;if(se)throw se;if(pe)throw pe;

      const programMap=new Map((programs??[]).map(p=>[[p.cycle_id,p.level_id,p.series_id??"NULL",p.subject_id].join("|"),p as Program]));
      setRows(assignments.map(a=>{
        const cs=classSubjects.find(x=>x.id===a.class_subject_id);
        const cl=classes?.find(x=>x.id===cs?.class_id);
        const s=subjects?.find(x=>x.id===cs?.subject_id);
        if(!cs||!cl||!s)return null;
        return {assignment:a,classRow:cl,subject:s,program:programMap.get([cl.cycle_id,cl.level_id,cl.series_id??"NULL",s.id].join("|"))};
      }).filter(Boolean) as {assignment:Assignment;classRow:SchoolClass;subject:Subject;program?:Program}[]);
    }catch(e){setError(e instanceof Error?e.message:"Impossible de charger votre espace.");}
    finally{setLoading(false)}
  }

  const unique=useMemo(()=>rows,[rows]);
  if(loading)return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-slate-500">Chargement de votre espace enseignant…</main>;

  return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8">
    <header className="mb-7"><p className="text-sm text-slate-400">Espace métier</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Mon enseignement</h1><p className="mt-2 text-sm text-slate-500">Vos classes et matières sont déterminées par vos affectations pédagogiques officielles.</p></header>
    {error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Stat icon={UsersRound} label="Classes affectées" value={new Set(unique.map(x=>x.classRow.id)).size}/>
      <Stat icon={BookOpen} label="Matières affectées" value={new Set(unique.map(x=>x.subject.id)).size}/>
      <Stat icon={ClipboardList} label="Programmes disponibles" value={unique.filter(x=>x.program).length}/>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Mes classes et matières</h2></div>
      <div className="divide-y divide-slate-100">
        {!unique.length&&<div className="p-10 text-center text-sm text-slate-400">Aucune affectation pédagogique active.</div>}
        {unique.map(x=><div key={x.assignment.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-600"/><p className="font-semibold text-slate-800">{x.classRow.name}</p></div><p className="mt-1 text-sm text-slate-500">{x.subject.name}</p>{x.program&&<p className="mt-1 text-xs text-slate-400">Programme : {x.program.name}</p>}</div>
          {x.program?<button onClick={()=>router.push(`/enseignant/programmes/${x.program.id}?classId=${x.classRow.id}&yearId=${x.classRow.academic_year_id}`)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Voir la progression</button>:<span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Programme non configuré</span>}
        </div>)}
      </div>
    </section>
  </main>
}
function Stat({icon:Icon,label,value}:{icon:typeof UsersRound;label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div><Icon className="h-5 w-5 text-violet-600"/></div></div>}
