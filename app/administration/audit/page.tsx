"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";

type AuditRow = {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
  actor?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role?: { name: string | null } | null;
  } | null;
};

function formatAction(action: string) {
  return action
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AuditPage() {
  const { profile, school, hasPermission, loading: identityLoading } =
    useCurrentUser();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRead = hasPermission("audit.read");

  useEffect(() => {
    if (identityLoading || !profile || !canRead) {
      if (!identityLoading && !canRead) setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: auditError } = await supabase
        .from("audit_logs")
        .select(
          "id, action, table_name, record_id, user_id, old_data, new_data, ip_address, created_at, users!audit_logs_user_id_fkey(first_name,last_name,email,roles(name))"
        )
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled) return;

      if (auditError) {
        setError(auditError.message);
        setRows([]);
      } else {
        const normalized = ((data ?? []) as Array<Record<string, unknown>>).map(
          (row) => ({
            ...(row as unknown as AuditRow),
            actor: Array.isArray(row.users)
              ? ((row.users[0] as AuditRow["actor"]) ?? null)
              : ((row.users as AuditRow["actor"]) ?? null),
          })
        );
        setRows(normalized);
      }
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [identityLoading, profile, canRead]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => {
      const actor = row.actor;
      const actorName = [actor?.first_name, actor?.last_name]
        .filter(Boolean)
        .join(" ");
      return [
        row.action,
        row.table_name,
        row.record_id,
        actorName,
        actor?.email,
        row.ip_address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query]);

  if (identityLoading) {
    return (
      <main className="min-h-full bg-[#F6F7FB] p-6">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[24px] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-80 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (!canRead) {
    return (
      <main className="min-h-full bg-[#F6F7FB] p-6 lg:p-10">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Accès restreint
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Le journal d’audit est réservé aux comptes disposant de la
            permission de consultation dédiée.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#F6F7FB] p-5 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Administration · Contrôle
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Journal d’audit
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Traçabilité des opérations critiques de l’établissement. Les
              événements sont consultés dans le périmètre de cette école.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Périmètre
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {school?.name ?? "Établissement"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Événements chargés", value: rows.length, icon: Activity },
            {
              label: "Actions distinctes",
              value: new Set(rows.map((row) => row.action)).size,
              icon: FileSearch,
            },
            {
              label: "Acteurs identifiés",
              value: new Set(rows.map((row) => row.user_id).filter(Boolean)).size,
              icon: UserRound,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    {item.label}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-950">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 p-5 lg:p-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une action, un acteur, une table ou un identifiant…"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
          </div>

          {error ? (
            <div className="p-8 text-sm text-red-600">{error}</div>
          ) : loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Chargement du journal…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Aucun événement d’audit à afficher
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Les prochaines opérations traçables apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const actorName =
                  [row.actor?.first_name, row.actor?.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  row.actor?.email ||
                  "Compte système";
                const isOpen = expanded === row.id;

                return (
                  <div key={row.id} className="px-5 py-4 lg:px-6">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      className="flex w-full items-center gap-4 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {formatAction(row.action)}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {actorName} · {row.table_name ?? "Opération système"}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs font-medium text-slate-500">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString("fr-FR")
                            : "Date inconnue"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {row.record_id ?? "—"}
                        </p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="font-bold text-slate-400">Acteur</p>
                            <p className="mt-1">{actorName}</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-400">Adresse IP</p>
                            <p className="mt-1">{row.ip_address ?? "Non renseignée"}</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-400">Anciennes données</p>
                            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3">
                              {JSON.stringify(row.old_data ?? {}, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-bold text-slate-400">Nouvelles données</p>
                            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3">
                              {JSON.stringify(row.new_data ?? {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
