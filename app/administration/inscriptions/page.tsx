"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";
import {
  fetchEnrollmentsForSchool,
  type EnrollmentRow,
} from "@/lib/administration/enrollments";

export default function AdministrationInscriptionsPage() {
  const { schoolId, school, hasPermission, loading: userLoading } =
    useCurrentUser();
  const canRead =
    hasPermission("enrollments.read") || hasPermission("enrollments.manage");

  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    if (userLoading) return;
    if (!schoolId || !canRead) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const result = await fetchEnrollmentsForSchool(supabase, schoolId);
      if (cancelled) return;
      setRows(result.data);
      setError(result.error);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId, canRead, userLoading]);

  const years = useMemo(() => {
    const set = new Map<string, string>();
    for (const r of rows) {
      if (r.academic_year_id) {
        set.set(r.academic_year_id, r.year_name || r.academic_year_id.slice(0, 8));
      }
    }
    return Array.from(set.entries());
  }, [rows]);

  const filtered = useMemo(() => {
    if (yearFilter === "all") return rows;
    return rows.filter((r) => r.academic_year_id === yearFilter);
  }, [rows, yearFilter]);

  if (!userLoading && !canRead) {
    return (
      <main className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">Inscriptions</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Permission <code>enrollments.read</code> requise.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Élève → inscription → classe, contextualisé par année scolaire. Pas de
          double fiche (PRD).
          {school?.name ? ` · ${school.name}` : ""}
        </p>
      </header>

      <div className="mb-4">
        <label className="mr-2 text-sm text-slate-600">Année scolaire</label>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">Toutes</option>
          {years.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Chargement des inscriptions…</p>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucune inscription pour le filtre sélectionné.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Élève</th>
                <th className="px-4 py-3 font-semibold">Classe</th>
                <th className="px-4 py-3 font-semibold">Année</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.student_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.class_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.year_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.status || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
