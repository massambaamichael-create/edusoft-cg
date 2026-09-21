"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional data loading */


import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";
import {
  fetchTeacherClasses,
  type TeacherClassRow,
} from "@/lib/enseignant/assignments";

export default function EnseignantClassesPage() {
  const { profile, loading: userLoading } = useCurrentUser();
  const [classes, setClasses] = useState<TeacherClassRow[]>([]);
  const [source, setSource] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!profile?.id) {
      setLoading(false);
      setError("Profil utilisateur introuvable.");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      const supabase = createClient();
      const result = await fetchTeacherClasses(supabase, profile.id);
      if (cancelled) return;
      setClasses(result.classes);
      setSource(result.source);
      setError(result.error);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, userLoading]);

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mes classes</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Uniquement les classes qui vous sont affectées. Source :{" "}
          <code className="text-teal-700">
            {source || "teacher_assignments"}
          </code>
          .
        </p>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Chargement de vos classes…</p>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucune classe ne vous est encore affectée pour cette année.
          Contactez la direction pédagogique.
        </div>
      )}

      {!loading && classes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <article
              key={c.classId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {c.className}
              </h2>
              {c.academicYearName && (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-teal-700">
                  {c.academicYearName}
                </p>
              )}
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Matières
                </p>
                {c.subjects.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">—</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {c.subjects.map((s) => (
                      <li
                        key={`${c.classId}-${s.id}`}
                        className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-100"
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
