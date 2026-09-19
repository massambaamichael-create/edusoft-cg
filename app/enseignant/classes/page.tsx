"use client";

export default function EnseignantClassesPage() {
  return (
    <main className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Mes classes</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Cette page listera uniquement les classes qui vous sont affectées via{" "}
        <code className="text-teal-700">teacher_assignments</code> et le
        contrôle <code className="text-teal-700">is_my_class_subject</code>.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Contenu à brancher (Release 1 — affectations)
      </div>
    </main>
  );
}
