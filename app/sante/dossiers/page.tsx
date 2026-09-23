"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";

type Student = { id: string; first_name: string; last_name: string; registration_number: string | null };
type Health = { id: string; student_id: string; allergies: string | null; blood_group: string | null; vaccinations: string | null; medical_notes: string | null; emergency_contact: string | null };

export default function HealthRecordsPage() {
  const { hasAnyPermission } = useCurrentUser();
  const [rows, setRows] = useState<Array<Health & { student?: Student }>>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("health_records").select("id,student_id,allergies,blood_group,vaccinations,medical_notes,emergency_contact").order("created_at", { ascending: false });
    if (error) { setMessage(error.message); setLoading(false); return; }
    const health = (data ?? []) as Health[];
    const ids = health.map((x) => x.student_id);
    const students = ids.length ? await supabase.from("students").select("id,first_name,last_name,registration_number").in("id", ids) : { data: [], error: null };
    if (students.error) setMessage(students.error.message);
    const lookup: Record<string, Student> = {};
    (students.data ?? []).forEach((s) => { lookup[s.id] = s; });
    setRows(health.map((h) => ({ ...h, student: lookup[h.student_id] })));
    setLoading(false);
  }

  const filtered = rows.filter((r) => [r.student?.first_name, r.student?.last_name, r.student?.registration_number].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase()));

  if (!hasAnyPermission("health.read", "health.manage")) {
    return <main className="min-h-full bg-[#F7F8FC] p-8"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Accès aux dossiers de santé non autorisé.</div></main>;
  }

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><HeartPulse className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-rose-700">Espace protégé</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Dossiers de santé</h1></div></div>
          <p className="mt-3 text-sm text-slate-500">Informations médicales accessibles uniquement selon les permissions Santé.</p>
        </header>

        <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-600"><ShieldCheck className="h-5 w-5 text-rose-700" /> Les données médicales restent dans l’espace Infirmerie et ne sont pas exposées à la Vie scolaire.</div>
          <div className="relative mt-4 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher un élève..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-300" /></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Chargement…</div> : message ? <div className="p-10 text-center text-sm text-red-600">{message}</div> : !filtered.length ? <div className="p-10 text-center text-sm text-slate-500">Aucun dossier de santé.</div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50"><tr className="border-b border-slate-200">{["Élève","Matricule","Allergies","Groupe","Vaccinations","Contact urgence"].map(h=><th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-b border-slate-100 last:border-0"><td className="px-5 py-4 font-semibold text-slate-900">{r.student ? [r.student.last_name,r.student.first_name].join(" ") : "Élève introuvable"}</td><td className="px-5 py-4 text-sm text-slate-600">{r.student?.registration_number || "—"}</td><td className="px-5 py-4 text-sm text-slate-600">{r.allergies || "—"}</td><td className="px-5 py-4 text-sm text-slate-600">{r.blood_group || "—"}</td><td className="px-5 py-4 text-sm text-slate-600">{r.vaccinations || "—"}</td><td className="px-5 py-4 text-sm text-slate-600">{r.emergency_contact || "—"}</td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </main>
  );
}
