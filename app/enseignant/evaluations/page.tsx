"use client";

export default function EnseignantEvaluationsPage() {
  return (
    <main className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Évaluations</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Création et correction des évaluations sur vos seules matières
        affectées (permissions assessments.* et grades.*).
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Contenu à brancher (module évaluations)
      </div>
    </main>
  );
}
