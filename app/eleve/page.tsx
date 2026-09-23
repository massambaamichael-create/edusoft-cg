"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, CalendarDays, CreditCard, GraduationCap, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Overview = {
  profile: { first_name: string | null; last_name: string | null; email: string | null; login_identifier: string | null };
  students: Array<{ id: string; first_name: string; last_name: string; registration_number: string | null; class_name: string | null; academic_year_name: string | null; status: string | null }>;
  report_cards: Array<{ student_id: string; term: number; average: number | null; rank: number | null; decision: string | null; status: string | null }>;
  payments: Array<{ student_id: string; amount: number; payment_type: string; payment_date: string; payment_method: string | null }>;
  attendance: Array<{ student_id: string; attendance_date: string; status: string; remark: string | null }>;
};

export default function ÉlèvePortalPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      window.location.href = "/";
      return;
    }

    const response = await fetch("/api/portal/overview", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || result.role !== "Élève") {
      setError(result?.error || "Accès élève indisponible.");
      setLoading(false);
      return;
    }

    setData(result);
    setLoading(false);
  };

  const logout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <main className="min-h-screen bg-[#F6F7FB] grid place-items-center text-sm text-slate-500">Chargement de votre espace…</main>;
  if (error) return <main className="min-h-screen bg-[#F6F7FB] p-6 grid place-items-center"><div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm"><p className="font-semibold text-red-700">{error}</p></div></main>;
  if (!data) return null;

  const totalPayments = data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const latestCards = data.report_cards.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#F6F7FB]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white"><GraduationCap className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">EduSoft CG</p><h1 className="text-lg font-bold text-slate-950">Espace Élève</h1></div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <section className="rounded-[28px] bg-slate-900 p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Mon espace scolaire</p>
              <h2 className="mt-2 text-3xl font-bold">Bonjour {data.profile.first_name || "Élève"}.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Retrouvez votre parcours, vos résultats et vos informations scolaires depuis un seul espace sécurisé.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/65"><ShieldCheck className="h-4 w-4" /> Données limitées à votre dossier</div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat icon={<UserRound className="h-4 w-4" />} label="Profil" value={String(1)} />
          <Stat icon={<BookOpen className="h-4 w-4" />} label="Bulletins publiés" value={String(data.report_cards.length)} />
          <Stat icon={<CreditCard className="h-4 w-4" />} label="Paiements enregistrés" value={`${totalPayments.toLocaleString("fr-FR")} FCFA`} />
        </section>

        <section className="mt-8">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Mon parcours</p><h3 className="mt-1 text-xl font-bold text-slate-950">Mon parcours scolaire</h3></div>
          <div className="grid gap-4 md:grid-cols-2">
            {data.students.map((student) => (
              <article key={student.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div><h4 className="font-bold text-slate-950">{student.last_name} {student.first_name}</h4><p className="mt-1 text-sm text-slate-500">{student.class_name || "Classe non renseignée"} · {student.academic_year_name || "Année non renseignée"}</p></div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{student.status || "Actif"}</span>
                </div>
                <p className="mt-4 text-xs text-slate-400">Matricule · {student.registration_number || "Non renseigné"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-slate-500" /><h3 className="font-bold text-slate-950">Derniers bulletins</h3></div>
            <div className="space-y-3">{latestCards.length ? latestCards.map((card) => <div key={card.student_id + "-" + card.term} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-600">Trimestre {card.term}</span><span className="font-bold text-slate-950">{card.average ?? "—"}/20</span></div>) : <p className="text-sm text-slate-400">Aucun bulletin publié.</p>}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-500" /><h3 className="font-bold text-slate-950">Présences récentes</h3></div>
            <div className="space-y-3">{data.attendance.slice(0, 6).map((item, i) => <div key={item.student_id + "-" + item.attendance_date + "-" + i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-600">{new Date(item.attendance_date).toLocaleDateString("fr-FR")}</span><span className="text-sm font-semibold text-slate-900">{item.status}</span></div>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-xs font-bold uppercase tracking-[0.12em]">{label}</span></div><p className="mt-3 text-2xl font-bold text-slate-950">{value}</p></div>;
}
