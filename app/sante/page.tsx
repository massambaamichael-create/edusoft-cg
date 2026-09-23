"use client";

import { HeartPulse, LockKeyhole, FileHeart } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export default function SanteHomePage() {
  const { profile, school, role } = useCurrentUser();
  const firstName = profile?.first_name || "Collègue";

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-rose-700">Espace protégé</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Infirmerie</h1>
        <p className="mt-2 text-sm text-slate-500">{school?.name || "EduSoft CG"} · {role} · Bonjour {firstName}</p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <Info icon={HeartPulse} title="Suivi santé" text="Les informations de santé sont isolées des autres espaces métier." />
        <Info icon={LockKeyhole} title="Accès restreint" text="Les données sont visibles uniquement selon les permissions prévues." />
        <Info icon={FileHeart} title="Dossiers élèves" text="Les informations sont rattachées à l’élève sans recréer une fiche ailleurs." />
      </section>

      <section className="mt-8 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Confidentialité</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          L’espace Infirmerie reste indépendant de la Vie scolaire. Aucune donnée médicale n’est affichée dans les autres espaces sans permission explicite.
        </p>
      </section>
    </main>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof HeartPulse; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-slate-500">{text}</p>
    </div>
  );
}
