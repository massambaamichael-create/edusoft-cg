"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
type A={id:string;title:string;status:string;assessment_date:string|null;class_id:string|null};
export default function CorrectionsIndex(){
 const [items,setItems]=useState<A[]>([]),[classes,setClasses]=useState<Record<string,string>>({});
 useEffect(()=>{void load()},[]);
 async function load(){
  const a=await supabase.from("assessments").select("id,title,status,assessment_date,class_id").in("status",["published","completed"]).order("assessment_date",{ascending:false});
  const ids=(a.data??[]).map(x=>x.class_id).filter(Boolean) as string[];
  const c=ids.length?await supabase.from("classes").select("id,name").in("id",ids):{data:[] as any[]};
  const map:Record<string,string>={};(c.data??[]).forEach((x:any)=>map[x.id]=x.name);setItems(a.data??[]);setClasses(map);
 }
 return <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
  <header><p className="text-sm font-semibold text-violet-700">Espace Enseignant</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Mes corrections</h1><p className="mt-2 text-sm text-slate-500">Ouvrez une évaluation pour saisir directement les notes finales après votre correction manuelle.</p></header>
  <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">{!items.length?<div className="p-10 text-center text-sm text-slate-500">Aucune évaluation disponible pour la correction.</div>:items.map(a=><div key={a.id} className="flex flex-col gap-4 border-b p-5 last:border-0 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><ClipboardCheck className="mt-1 h-5 w-5 text-violet-600"/><div><p className="font-semibold">{a.title}</p><p className="mt-1 text-sm text-slate-500">{a.class_id?classes[a.class_id]:"Classe"} · {a.assessment_date??"Date non définie"} · {a.status}</p></div></div><Link href={"/enseignant/corrections/"+a.id} className="rounded-xl bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white">Corriger</Link></div>)}</section>
 </div></main>;
}
