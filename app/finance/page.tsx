"use client";

import { useCurrentUser } from "@/lib/auth";

export default function FinanceHomePage() {
  const { profile, school, hasPermission, role } = useCurrentUser();
  const firstName = profile?.first_name || "Collègue";

  return (
    <main className="px-6 py-8 lg:px-10">
      <p className="text-sm font-medium text-emerald-700">Espace finance</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">
        Bonjour, {firstName}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {school?.name || "EduSoft CG"} · rôle {role}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Paiements"
          desc="Enregistrement et suivi"
          enabled={hasPermission("payments.create") || hasPermission("finance.read")}
        />
        <Card
          title="Frais scolaires"
          desc="Grilles et échéances"
          enabled={hasPermission("finance.manage") || hasPermission("finance.read")}
        />
        <Card
          title="Rapports"
          desc="Indicateurs financiers"
          enabled={hasPermission("financial_reports.read")}
        />
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Branchage prévu sur payments, school_fees, payment_receipts et les
        permissions finance.* / payments.*.
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
