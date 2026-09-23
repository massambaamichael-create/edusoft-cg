"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FileText,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export default function AdministrationHomePage() {
  const router = useRouter();
  const { profile, school, hasPermission, role } = useCurrentUser();
  const firstName = profile?.first_name || "Collègue";

  const cards = [
    {
      title: "Élèves",
      desc: "Dossiers uniques et informations administratives.",
      meta: "Référentiel élèves",
      icon: Users,
      href: "/administration/eleves",
      enabled:
        hasPermission("students.read") || hasPermission("students.create"),
    },
    {
      title: "Parents / tuteurs",
      desc: "Responsables et liens de parenté sans duplication.",
      meta: "Responsables",
      icon: UserRound,
      href: "/administration/parents",
      enabled:
        hasPermission("parents.read") || hasPermission("parents.manage"),
    },
    {
      title: "Inscriptions",
      desc: "Élève → classe → année scolaire, avec historique.",
      meta: "Scolarité",
      icon: ClipboardList,
      href: "/administration/inscriptions",
      enabled:
        hasPermission("enrollments.read") ||
        hasPermission("enrollments.manage"),
    },
    {
      title: "Documents",
      desc: "Registre, validation, archivage — une source, un workflow.",
      meta: "Documents & workflows",
      icon: FileText,
      href: "/administration/documents",
      enabled:
        hasPermission("documents.read") ||
        hasPermission("documents.upload") ||
        hasPermission("documents.validate"),
    },
    {
      title: "Journal d’audit",
      desc: "Traçabilité des opérations critiques de l’établissement.",
      meta: "Contrôle",
      icon: Activity,
      href: "/administration/audit",
      enabled: hasPermission("audit.read"),
    },
    {
      title: "Accès & comptes",
      desc: "Identités, rôles et activation des comptes utilisateurs.",
      meta: "Identity & Access",
      icon: ShieldCheck,
      href: "/administration/acces",
      enabled:
        hasPermission("users.read") ||
        hasPermission("users.manage") ||
        hasPermission("identity.manage"),
    },
  ];

  return (
    <main className="min-h-full bg-[#F6F7FB] px-6 py-7 lg:px-10 lg:py-9">
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Espace métier
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Administration
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {school?.name || "EduSoft CG"} · {role || "Utilisateur"} · Bonjour{" "}
              {firstName}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                Données protégées
              </p>
              <p className="text-[11px] text-slate-400">
                Accès selon vos permissions
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-slate-100/80 blur-3xl" />
        <div className="relative p-6 lg:p-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Référentiel administratif
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Une information. Une seule source.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Les données administratives sont créées une seule fois puis
              réutilisées par la pédagogie, la finance, la vie scolaire et les
              autres espaces autorisés.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.href}
                  type="button"
                  disabled={!card.enabled}
                  onClick={() => router.push(card.href)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_14px_35px_-22px_rgba(15,23,42,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-slate-700" />
                  </div>

                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {card.meta}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 min-h-10 text-sm leading-5 text-slate-500">
                    {card.desc}
                  </p>
                  <p className="mt-5 text-xs font-semibold text-slate-400 transition group-hover:text-slate-700">
                    {card.enabled ? "Ouvrir le module →" : "Permission requise"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
