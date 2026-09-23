"use client";

import { useEffect, useState } from "react";
import { UserCheck, ShieldAlert, CalendarDays, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";

export default function VieScolaireHomePage() {
  const { profile, school, role } = useCurrentUser();
  const [absences, setAbsences] = useState(0);
  const [incidents, setIncidents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ count: attendanceCount }, { count: disciplineCount }] = await Promise.all([
      supabase.from("student_attendance").select("*", { count: "exact", head: true }),
      supabase.from("discipline_records").select("*", { count: "exact", head: true }),
    ]);
    setAbsences(attendanceCount ?? 0);
    setIncidents(disciplineCount ?? 0);
    setLoading(false);
  }

  const firstName = profile?.first_name || "Collègue";

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-indigo-700">Suivi de la vie scolaire</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Bonjour, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {school?.name || "EduSoft CG"} · {role}
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UserCheck} label="Enregistrements de présence" value={absences} loading={loading} />
        <Metric icon={ShieldAlert} label="Dossiers disciplinaires" value={incidents} loading={loading} />
        <Metric icon={CalendarDays} label="Suivi quotidien" value="Actif" />
        <Metric icon={Activity} label="Historique" value="Centralisé" />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Suivi opérationnel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Présences, absences, retards et discipline sont gérés dans l’espace Vie scolaire.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Info title="Présences" text="Les enregistrements sont rattachés aux élèves et à leur contexte scolaire." />
          <Info title="Discipline" text="Les incidents restent accessibles selon les permissions du rôle." />
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof UserCheck;
  label: string;
  value: number | string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400">EduSoft</span>
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{loading ? "…" : value}</p>
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
