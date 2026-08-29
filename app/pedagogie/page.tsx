"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Plus,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function PedagogiePage() {
  const [classCount, setClassCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [reportCardCount, setReportCardCount] = useState(0);
  useEffect(() => {
  const fetchClassCount = async () => {
    const { count, error } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Erreur lors du chargement des classes :", error);
      return;
    }

    setClassCount(count ?? 0);
  };

  fetchClassCount();
}, []);
useEffect(() => {
  const fetchTeacherCount = async () => {
    const { count, error } = await supabase
      .from("teachers")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Erreur lors du chargement des enseignants :", error);
      return;
    }

    setTeacherCount(count ?? 0);
  };

  fetchTeacherCount();
}, []);
useEffect(() => {
  const fetchAssessmentCount = async () => {
    const { count, error } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(
        "Erreur lors du chargement des évaluations :",
        error
      );
      return;
    }

    setAssessmentCount(count ?? 0);
  };

  fetchAssessmentCount();
}, []);
useEffect(() => {
  const fetchReportCardCount = async () => {
    const { count, error } = await supabase
      .from("report_cards")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(
        "Erreur lors du chargement des bulletins :",
        error
      );
      return;
    }

    setReportCardCount(count ?? 0);
  };

  fetchReportCardCount();
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
        </div>

        <button className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">
          <Plus className="h-4 w-4" />
          Nouvelle évaluation
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Classes"
          value={classCount.toString()}
          description="Classes actives"
          icon={<BookOpen className="h-5 w-5" />}
          color="violet"
        />

        <StatCard
          title="Enseignants"
          value={teacherCount.toString()}
          description="Enseignants affectés"
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />

        <StatCard
          title="Évaluations"
          value={assessmentCount.toString()}
          description="Cette année"
          icon={<ClipboardList className="h-5 w-5" />}
          color="amber"
        />

        <StatCard
          title="Bulletins"
          value={reportCardCount.toString()}
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
            title="Nouvelle évaluation"
            description="Créer un devoir, examen ou contrôle"
          />

          <QuickAction
            icon={<FileCheck2 className="h-5 w-5" />}
            title="Saisir les notes"
            description="Entrer les notes des élèves"
          />

          <QuickAction
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Valider les notes"
            description="Contrôler les notes soumises"
          />

          <QuickAction
            icon={<GraduationCap className="h-5 w-5" />}
            title="Générer les bulletins"
            description="Créer les bulletins PDF"
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
              Suivez l'avancement de la saisie et de la validation des notes.
            </p>
          </div>

          <button className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
            Voir tout
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
              <StatusRow
                className="Aucune donnée"
                progress={0}
                status="En attente"
                type="waiting"
              />

              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-gray-400"
                >
                  Aucune donnée pédagogique disponible pour le moment.
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50">
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

function StatusRow({
  className,
  progress,
  status,
  type,
}: {
  className: string;
  progress: number;
  status: string;
  type: "success" | "progress" | "waiting";
}) {
  const statusStyles = {
    success: "bg-emerald-50 text-emerald-700",
    progress: "bg-amber-50 text-amber-700",
    waiting: "bg-gray-100 text-gray-600",
  };

  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    progress: <Clock3 className="h-4 w-4" />,
    waiting: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-4">
        <span className="text-sm font-semibold text-gray-900">
          {className}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="text-xs font-medium text-gray-500">
            {progress}%
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[type]}`}
        >
          {icons[type]}
          {status}
        </span>
      </td>

      <td className="px-6 py-4 text-right">
        <button className="text-sm font-semibold text-violet-600 hover:text-violet-700">
          Ouvrir
        </button>
      </td>
    </tr>
  );
}