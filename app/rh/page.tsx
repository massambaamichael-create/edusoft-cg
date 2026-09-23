"use client";

import { UsersRound, ShieldCheck, FileText } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export default function RHHomePage() {
  const { profile, school, role } = useCurrentUser();
  const firstName = profile?.first_name || "Collègue";

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-slate-600">Espace métier</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Ressources humaines</h1>
        <p className="mt-2 text-sm text-slate-500">{school?.name || "EduSoft CG"} · {role} · Bonjour {firstName}</p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <Info icon={UsersRound} title="Personnel" text="Référentiel du personnel de l’établissement." />
        <Info icon={ShieldCheck} title="Accès" text="Les données RH sont séparées des espaces pédagogiques et financiers." />
        <Info icon={FileText} title="Documents" text="Les documents RH restent rattachés au personnel concerné." />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Espace RH</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Le tableau de bord constitue le point d’entrée RH. Les données et actions disponibles dépendent du rôle et des permissions de l’utilisateur.
        </p>
      </section>
    </main>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof UsersRound; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-slate-500">{text}</p>
    </div>
  );
}
