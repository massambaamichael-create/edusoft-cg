"use client";

import { useRouter } from "next/navigation";
import { Users, UserRound, ClipboardList, ArrowRight } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export default function AdministrationHomePage() {
  const router = useRouter();
  const { profile, school, hasPermission, role } = useCurrentUser();
  const firstName = profile?.first_name || "Collègue";

  const cards = [
    {
      title: "Élèves",
      desc: "Dossiers uniques et informations administratives.",
      icon: Users,
      href: "/administration/eleves",
      enabled: hasPermission("students.read") || hasPermission("students.create"),
    },
    {
      title: "Parents / tuteurs",
      desc: "Responsables liés aux élèves sans duplication.",
      icon: UserRound,
      href: "/administration/parents",
      enabled: hasPermission("parents.read") || hasPermission("parents.manage"),
    },
    {
      title: "Inscriptions",
      desc: "Affectation d’un élève à une classe et une année scolaire.",
      icon: ClipboardList,
      href: "/administration/inscriptions",
      enabled: hasPermission("enrollments.read") || hasPermission("enrollments.manage"),
    },
  ];

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-slate-600">Espace métier</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Administration</h1>
        <p className="mt-2 text-sm text-slate-500">
          {school?.name || "EduSoft CG"} · {role} · Bonjour {firstName}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Référentiel administratif</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Une information, une seule source</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Les dossiers élèves, parents et inscriptions sont réutilisés par les autres modules selon leurs permissions.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.href}
                type="button"
                disabled={!card.enabled}
                onClick={() => router.push(card.href)}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">{card.desc}</p>
                <p className="mt-4 text-xs font-semibold text-slate-400">
                  {card.enabled ? "Accéder au module" : "Permission requise"}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
