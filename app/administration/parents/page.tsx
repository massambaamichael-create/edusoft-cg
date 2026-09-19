"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";
import {
  fetchParentsForSchool,
  fetchStudentParentLinks,
  parentDisplayName,
  type ParentRow,
} from "@/lib/administration/parents";

export default function AdministrationParentsPage() {
  const { schoolId, school, hasPermission, loading: userLoading } =
    useCurrentUser();
  const canRead =
    hasPermission("parents.read") || hasPermission("parents.manage");
  const canManage = hasPermission("parents.manage");

  const [parents, setParents] = useState<ParentRow[]>([]);
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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
      const [pRes, lRes] = await Promise.all([
        fetchParentsForSchool(supabase, schoolId),
        fetchStudentParentLinks(supabase, schoolId),
      ]);
      if (cancelled) return;

      setParents(pRes.data);
      setError(pRes.error || lRes.error);

      const counts: Record<string, number> = {};
      for (const link of lRes.data) {
        counts[link.parent_id] = (counts[link.parent_id] || 0) + 1;
      }
      setLinkCounts(counts);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId, canRead, userLoading]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return parents;
    return parents.filter((p) => {
      const blob = [p.first_name, p.last_name, p.phone, p.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [parents, q]);

  if (!userLoading && !canRead) {
    return (
      <main className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">Parents</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Permission <code>parents.read</code> requise.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parents / tuteurs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Un parent, plusieurs enfants via{" "}
            <code className="text-slate-700">student_parents</code>
            {school?.name ? ` · ${school.name}` : ""}.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            disabled
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
          >
            Nouveau parent
          </button>
        )}
      </header>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, téléphone, email…)"
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Chargement des parents…</p>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucun parent enregistré pour cet établissement.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Parent</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Enfants liés</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {parentDisplayName(p)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.phone || p.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {linkCounts[p.id] ?? 0}
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
