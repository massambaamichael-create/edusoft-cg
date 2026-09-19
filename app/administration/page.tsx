"use client";

import { useCurrentUser } from "@/lib/auth";

export default function AdministrationHomePage() {
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

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Élèves"
          desc="Dossiers et fiches élèves"
          enabled={hasPermission("students.read")}
        />
        <Card
          title="Parents / tuteurs"
          desc="Fiches et liaisons multi-enfants"
          enabled={hasPermission("parents.read")}
        />
        <Card
          title="Inscriptions"
          desc="Inscriptions et réinscriptions par année"
          enabled={hasPermission("enrollments.read")}
        />
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Les écrans métier seront branchés sur les tables déjà présentes
        (students, parents, student_parents, student_enrollments) et les
        permissions students.* / parents.* / enrollments.*.
      </p>
    </main>
  );
}

function Card({
  title,
  desc,
  enabled,
}: {
  title: string;
  desc: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        enabled ? "border-slate-200" : "border-slate-100 opacity-60"
      }`}
    >
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
      <p className="mt-3 text-xs font-medium text-slate-400">
        {enabled ? "Permission OK" : "Permission manquante"}
      </p>
    </div>
  );
}
