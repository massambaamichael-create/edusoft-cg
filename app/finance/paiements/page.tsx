"use client";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";

type Payment = { id:string; student_id:string; payment_type:string; amount:number; payment_date:string; payment_method:string; reference:string|null; status:string };
type Student = { id:string; first_name:string; last_name:string; registration_number:string|null };

export default function PaymentsPage(){
 const {hasPermission}=useCurrentUser();
 const [payments,setPayments]=useState<Payment[]>([]),[students,setStudents]=useState<Record<string,Student>>({}),[search,setSearch]=useState(""),[loading,setLoading]=useState(true);
 const canRead=hasPermission("finance.read")||hasPermission("payments.create");
 useEffect(()=>{if(canRead)void load();else setLoading(false)},[canRead]);
 async function load(){
  setLoading(true);
  const {data,error}=await supabase.from("payments").select("id,student_id,payment_type,amount,payment_date,payment_method,reference,status").order("payment_date",{ascending:false}).limit(100);
  if(error){setLoading(false);return}
  const rows=(data??[]) as Payment[];setPayments(rows);
  const ids=[...new Set(rows.map(x=>x.student_id))];
  if(ids.length){const {data:s}=await supabase.from("students").select("id,first_name,last_name,registration_number").in("id",ids);const map:Record<string,Student>={};for(const x of (s??[]) as Student[])map[x.id]=x;setStudents(map)}
  setLoading(false);
 }
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return payments;return payments.filter(p=>{const s=students[p.student_id];return [s?.first_name,s?.last_name,s?.registration_number,p.reference].filter(Boolean).join(" ").toLowerCase().includes(q)})},[payments,students,search]);
 const total=filtered.reduce((sum,p)=>sum+Number(p.amount||0),0);
 if(!canRead)return <Restricted title="Paiements"/>;
 return <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-emerald-700">Finance</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Paiements</h1><p className="mt-2 text-sm text-slate-500">Registre des opérations enregistrées dans l’établissement.</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total affiché</p><p className="mt-1 text-xl font-bold text-emerald-950">{total.toLocaleString("fr-FR")} FCFA</p></div></header>
  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><Search className="h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un élève ou une référence…" className="w-full bg-transparent text-sm outline-none"/></div>
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{loading?<div className="p-10 text-center text-sm text-slate-400">Chargement…</div>:!filtered.length?<div className="p-10 text-center text-sm text-slate-400">Aucun paiement enregistré.</div>:<div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="border-b bg-slate-50"><tr>{["Élève","Type","Montant","Date","Mode","Statut"].map(h=><th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(p=>{const s=students[p.student_id];return <tr key={p.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{s?[s.last_name,s.first_name].filter(Boolean).join(" "):"Élève"}</p><p className="text-xs text-slate-400">{s?.registration_number??"—"}</p></td><td className="px-5 py-4 text-sm text-slate-600">{p.payment_type}</td><td className="px-5 py-4 text-sm font-semibold text-slate-900">{Number(p.amount).toLocaleString("fr-FR")} FCFA</td><td className="px-5 py-4 text-sm text-slate-600">{p.payment_date}</td><td className="px-5 py-4 text-sm text-slate-600">{p.payment_method}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{p.status}</span></td></tr>})}</tbody></table></div>}</section>
 </div></main>;
}
function Restricted({title}:{title:string}){return <main className="min-h-full bg-[#F7F8FC] p-8"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><CreditCard className="mx-auto h-8 w-8 text-slate-400"/><h1 className="mt-4 text-xl font-bold text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-500">Votre rôle ne dispose pas de la permission nécessaire.</p></div></main>;}
