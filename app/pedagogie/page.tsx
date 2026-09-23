"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Plus,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";

export default function PedagogiePage() {
  const router = useRouter();
  const { schoolId, loading: userLoading } = useCurrentUser();
  const [classCount, setClassCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [reportCardCount, setReportCardCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [academicYearName, setAcademicYearName] = useState("Aucune année active");
  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("school_id")
        .eq("auth_user_id", session.user.id)
        .single();

      if (profileError || !userProfile?.school_id) return;

      const { data: activeYear } = await supabase
        .from("academic_years")
        .select("id, name")
        .eq("school_id", userProfile.school_id)
        .eq("is_active", true)
        .maybeSingle();

      setAcademicYearName(activeYear?.name ?? "Aucune année active");

      const [classes, teachers, assessments, reportCards] = await Promise.all([
        supabase.from("classes").select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id)
          .eq("academic_year_id", activeYear?.id ?? ""),
        supabase.from("teachers").select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id),
        supabase.from("assessments").select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id)
          .eq("academic_year_id", activeYear?.id ?? ""),
        supabase.from("report_cards").select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id)
          .eq("academic_year_id", activeYear?.id ?? ""),
      ]);

      setClassCount(classes.count ?? 0);
      setTeacherCount(teachers.count ?? 0);
      setAssessmentCount(assessments.count ?? 0);
      setReportCardCount(reportCards.count ?? 0);
    };

    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-600">
            Gestion pédagogique
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Pédagogie
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Gérez les classes, matières, évaluations, notes et résultats.
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Année active : {academicYearName}
          </div>
        </div>

        <button type="button" onClick={() => router.push("/pedagogie/evaluations")} className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">
          <Plus className="h-4 w-4" />
          Nouvelle évaluation
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Classes"
          value={dataLoading ? "…" : classCount.toString()}
          description="Classes actives"
          icon={<BookOpen className="h-5 w-5" />}
          color="violet"
        />

        <StatCard
          title="Enseignants"
          value={dataLoading ? "…" : teacherCount.toString()}
          description="Enseignants affectés"
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />

        <StatCard
          title="Évaluations"
          value={dataLoading ? "…" : assessmentCount.toString()}
          description="Cette année"
          icon={<ClipboardList className="h-5 w-5" />}
          color="amber"
        />

        <StatCard
          title="Bulletins"
          value={dataLoading ? "…" : reportCardCount.toString()}
          description="Générés"
          icon={<GraduationCap className="h-5 w-5" />}
          color="emerald"
        />
      </div>

      {/* QUICK ACTIONS */}
      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Actions rapides
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Accédez rapidement aux tâches pédagogiques les plus utilisées.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            icon={<Plus className="h-5 w-5" />}
            title="Évaluations & examens"
            description="Suivre et valider les évaluations"
            onClick={() => router.push("/pedagogie/evaluations")}
          />

          <QuickAction
            icon={<FileCheck2 className="h-5 w-5" />}
            title="Classes & notes"
            description="Accéder aux classes pédagogiques"
            onClick={() => router.push("/pedagogie/classes")}
          />

          <QuickAction
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Responsabilités"
            description="Contrôler les responsabilités pédagogiques"
            onClick={() => router.push("/pedagogie/responsabilites")}
          />

          <QuickAction
            icon={<GraduationCap className="h-5 w-5" />}
            title="Programmes & progression"
            description="Suivre les programmes officiels"
            onClick={() => router.push("/pedagogie/programmes")}
          />
        </div>
      </section>

      {/* PEDAGOGICAL STATUS */}
      <section className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              État pédagogique
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Suivez l’avancement de la saisie et de la validation des notes.
            </p>
          </div>

          <button type="button" onClick={() => router.push("/pedagogie/evaluations")} className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
            Voir les évaluations
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Classe
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Progression
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Statut
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                  Les indicateurs sont calculés à partir des données de l’établissement.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: "violet" | "blue" | "amber" | "emerald";
}) {
  const colors = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>

        <span className="text-xs font-medium text-gray-400">
          EduSoft
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>

      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}

