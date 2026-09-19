"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";

export default function AdministrationHomePage() {
  const router = useRouter();
  const { profile, school, hasPermission, role } = useCurrentUser();
  const firstName = profile?.first_name || "Collègue";

  return (
    <main className="px-6 py-8 lg:px-10">
      <p className="text-sm font-medium text-slate-500">Espace administration</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">
        Bonjour, {firstName}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {school?.name || "EduSoft CG"} · rôle {role}
      </p>

      <p className="mt-4 max-w-2xl text-sm text-slate-600">
        Une information créée une seule fois : élève, parent, inscription.
        Pas de double fiche (PRD).
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Élèves"
          desc="Dossiers uniques par établissement"
          enabled={hasPermission("students.read") || hasPermission("students.create")}
          onClick={() => router.push("/administration/eleves")}
        />
        <Card
          title="Parents / tuteurs"
          desc="Un parent, plusieurs enfants"
          enabled={hasPermission("parents.read") || hasPermission("parents.manage")}
          onClick={() => router.push("/administration/parents")}
        />
        <Card
          title="Inscriptions"
          desc="Élève → classe par année scolaire"
          enabled={
            hasPermission("enrollments.read") ||
            hasPermission("enrollments.manage")
          }
          onClick={() => router.push("/administration/inscriptions")}
        />
      </section>
    </main>
  );
}

function Card({
  title,
  desc,
  enabled,
  onClick,
}: {
  title: string;
  desc: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
        enabled
          ? "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          : "cursor-not-allowed border-slate-100 opacity-60"
      }`}
    >
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
      <p className="mt-3 text-xs font-medium text-slate-400">
        {enabled ? "Ouvrir →" : "Permission manquante"}
      </p>
    </button>
  );
}
