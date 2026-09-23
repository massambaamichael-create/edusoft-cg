"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ClipboardList, CheckCircle2, Clock3, XCircle } from "lucide-react";
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
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (userLoading) return;

    let cancelled = false;
    (async () => {
      if (!schoolId || !canRead) {
        if (!cancelled) setLoading(false);
        return;
      }

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
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.academic_year_id) {
        map.set(
          row.academic_year_id,
          row.year_name || row.academic_year_id.slice(0, 8)
        );
      }
    }
    return Array.from(map.entries());
  }, [rows]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.status) set.add(row.status);
    }
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesYear =
        yearFilter === "all" || row.academic_year_id === yearFilter;
      const matchesStatus =
        statusFilter === "all" || (row.status || "") === statusFilter;
      const matchesSearch =
        !term ||
        [row.student_name, row.class_name, row.year_name, row.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesYear && matchesStatus && matchesSearch;
    });
  }, [rows, q, yearFilter, statusFilter]);

  const summary = useMemo(() => {
    const source =
      yearFilter === "all"
        ? rows
        : rows.filter((row) => row.academic_year_id === yearFilter);

    const normalize = (value: string | null) => (value || "").toLowerCase();

    return {
      total: source.length,
      active: source.filter((row) =>
        ["active", "actif", "approved", "validée", "validee"].includes(
          normalize(row.status)
        )
      ).length,
      pending: source.filter((row) =>
        ["pending", "en attente", "draft"].includes(normalize(row.status))
      ).length,
      rejected: source.filter((row) =>
        ["rejected", "refused", "refusée", "refusee"].includes(
          normalize(row.status)
        )
      ).length,
    };
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
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Inscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Élève → inscription → classe, contextualisé par année scolaire.
          {school?.name ? ` · ${school.name}` : ""}
        </p>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Inscriptions"
          value={summary.total}
          icon={ClipboardList}
        />
        <SummaryCard
          label="Actives / validées"
          value={summary.active}
          icon={CheckCircle2}
        />
        <SummaryCard
          label="En attente"
          value={summary.pending}
          icon={Clock3}
        />
        <SummaryCard
          label="Refusées"
          value={summary.rejected}
          icon={XCircle}
        />
      </section>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Rechercher un élève, une classe…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            aria-label="Filtrer par année scolaire"
          >
            <option value="all">Toutes les années</option>
            {years.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading && (
        <p className="text-sm text-slate-500">Chargement des inscriptions…</p>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Aucune inscription trouvée
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Modifiez les filtres ou la recherche pour afficher d’autres dossiers.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">
              {filtered.length} inscription{filtered.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-400">
              Source : <code>student_enrollments</code>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Élève</th>
                  <th className="px-4 py-3 font-semibold">Classe</th>
                  <th className="px-4 py-3 font-semibold">Année</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.student_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.class_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.year_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const value = status || "—";
  const normalized = value.toLowerCase();

  const className = ["active", "actif", "approved", "validée", "validee"].includes(
    normalized
  )
    ? "bg-emerald-50 text-emerald-700"
    : ["pending", "en attente", "draft"].includes(normalized)
      ? "bg-amber-50 text-amber-700"
      : ["rejected", "refused", "refusée", "refusee"].includes(normalized)
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {value}
    </span>
  );
}
