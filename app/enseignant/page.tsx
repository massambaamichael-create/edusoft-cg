"use client";

import { BookOpen, ClipboardList, GraduationCap, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";

const cards = [
  {
    title: "Mes classes",
    description: "Classes qui vous sont affectées",
    href: "/enseignant/classes",
    icon: GraduationCap,
    color: "bg-teal-600",
  },
  {
    title: "Mes matières",
    description: "Matières et coefficients",
    href: "/enseignant/matieres",
    icon: BookOpen,
    color: "bg-cyan-600",
  },
  {
    title: "Évaluations",
    description: "Devoirs, notes et suivis",
    href: "/enseignant/evaluations",
    icon: ClipboardList,
    color: "bg-indigo-600",
  },
  {
    title: "Emploi du temps",
    description: "Votre planning de la semaine",
    href: "/enseignant/emploi-du-temps",
    icon: CalendarDays,
    color: "bg-violet-600",
  },
];

export default function EnseignantHomePage() {
  const router = useRouter();
  const { profile, school, hasPermission } = useCurrentUser();

  const firstName = profile?.first_name || "Enseignant";

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-teal-700">Espace enseignant</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Bonjour, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {school?.name
            ? `${school.name}${school.code ? ` · ${school.code}` : ""}`
            : "Votre espace pédagogique personnel"}
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-teal-100 bg-teal-50/80 px-5 py-4 text-sm text-teal-900">
        <p className="font-medium">Périmètre de travail</p>
        <p className="mt-1 text-teal-800/80">
          Vous ne voyez que les classes et matières qui vous sont affectées.
          Les actions (notes, évaluations, présences) respectent vos permissions
          et votre année scolaire active.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hasPermission("grades.write") && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200">
              Saisie des notes
            </span>
          )}
          {hasPermission("assessments.manage") && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200">
              Gestion des évaluations
            </span>
          )}
          {hasPermission("attendance.write") && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200">
              Présences
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.href}
              type="button"
              onClick={() => router.push(card.href)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
        <p className="text-sm font-medium text-slate-700">
          Prochaines étapes de cet espace
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Les pages « Mes classes », évaluations et emploi du temps seront
          branchées sur <code className="text-teal-700">teacher_assignments</code>{" "}
          et le helper <code className="text-teal-700">is_my_class_subject</code>,
          pour respecter strictement votre périmètre pédagogique.
        </p>
      </section>
    </main>
  );
}
