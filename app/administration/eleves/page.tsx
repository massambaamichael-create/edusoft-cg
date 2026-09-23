"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, Search, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";
import {
  createStudent,
  fetchStudentsForSchool,
  studentDisplayName,
  type StudentRow,
} from "@/lib/administration/students";

export default function AdministrationElevesPage() {
  const { schoolId, school, hasPermission, loading: userLoading } =
    useCurrentUser();
  const canRead =
    hasPermission("students.read") || hasPermission("students.create");
  const canCreate = hasPermission("students.create");

  const [rows, setRows] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [accessLoading, setAccessLoading] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ identifier: string; temporaryPassword: string } | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    matricule: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
  });

  const reload = async () => {
    if (!schoolId) return;
    const supabase = createClient();
    const result = await fetchStudentsForSchool(supabase, schoolId);
    setRows(result.data);
    setError(result.error);
  };

  useEffect(() => {
    if (userLoading) return;

    let cancelled = false;
    (async () => {
      if (!schoolId || !canRead) {
        if (!cancelled) setLoading(false);
        return;
      }
      setLoading(true);
      await reload();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, canRead, userLoading]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((s) => {
      const blob = [s.first_name, s.last_name, s.matricule, s.email, s.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [rows, q]);

  const handleProvisionAccess = async (studentId: string) => {
    setFormError("");
    setAccessLoading(studentId);

    try {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session?.access_token) {
        setFormError("Session expirée. Reconnectez-vous.");
        return;
      }

      const response = await fetch("/api/identity/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ entity: "student", entity_id: studentId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setFormError(result?.error || "Impossible de générer l'accès élève.");
        return;
      }

      if (result.temporaryPassword) {
        setCredentials({
          identifier: result.identifier,
          temporaryPassword: result.temporaryPassword,
        });
      } else {
        setFormError(result.message || "Cet élève possède déjà un accès.");
      }
    } catch {
      setFormError("Erreur réseau lors de la génération de l'accès.");
    } finally {
      setAccessLoading(null);
    }
  };

  const handleCreate = async () => {
    setFormError("");
    if (!schoolId) {
      setFormError("École introuvable.");
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError("Prénom et nom sont obligatoires.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const result = await createStudent(supabase, {
      school_id: schoolId,
      first_name: form.first_name,
      last_name: form.last_name,
      matricule: form.matricule,
      gender: form.gender,
      date_of_birth: form.date_of_birth,
      phone: form.phone,
      email: form.email,
    });
    setSaving(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setOpen(false);
    setForm({
      first_name: "",
      last_name: "",
      matricule: "",
      gender: "",
      date_of_birth: "",
      phone: "",
      email: "",
    });
    await reload();
  };

  if (!userLoading && !canRead) {
    return (
      <main className="min-h-full bg-[#F6F7FB] px-6 py-7 lg:px-10 lg:py-9">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"><Users className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Élèves</h1></div></div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Permission <code>students.read</code> requise.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Élèves</h1>
          <p className="mt-1 text-sm text-slate-500">
            Source unique <code className="text-slate-700">students</code>
            {school?.name ? ` · ${school.name}` : ""} — PRD.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Nouvel élève
          </button>
        )}
      </header>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, matricule, téléphone…)"
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
        />
      </div>
        </div>

      {loading && (
        <p className="text-sm text-slate-500">Chargement des élèves…</p>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucun élève pour cet établissement.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Élève</th>
                <th className="px-4 py-3 font-semibold">Matricule</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                {canCreate && <th className="px-4 py-3 text-right font-semibold">Accès</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {studentDisplayName(s)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.matricule || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.phone || s.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.is_active === false
                          ? "bg-slate-100 text-slate-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {s.is_active === false ? "Inactif" : "Actif"}
                    </span>
                  </td>
                  {canCreate && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleProvisionAccess(s.id)}
                        disabled={accessLoading === s.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        title="Générer les identifiants de l'espace élève"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {accessLoading === s.id ? "Génération…" : "Accès"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {credentials && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Identity & Access</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Accès élève généré</h2>
              </div>
              <button type="button" onClick={() => setCredentials(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
              <div><p className="text-xs text-slate-400">Identifiant</p><p className="mt-1 font-mono text-sm font-semibold text-slate-900">{credentials.identifier}</p></div>
              <div><p className="text-xs text-slate-400">Mot de passe temporaire</p><p className="mt-1 font-mono text-sm font-semibold text-slate-900">{credentials.temporaryPassword}</p></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Ces identifiants ne sont affichés qu'une fois dans cette interface. Le changement du mot de passe sera obligatoire à la première connexion.</p>
            <button type="button" onClick={() => setCredentials(null)} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Fermer</button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Nouvel élève</h2>
            <p className="mt-1 text-sm text-slate-500">
              Une seule fiche dans <code>students</code>, rattachée à l{"'"}école.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="Nom *"
                value={form.last_name}
                onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
              />
              <Field
                label="Prénom *"
                value={form.first_name}
                onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
              />
              <Field
                label="Matricule"
                value={form.matricule}
                onChange={(v) => setForm((f) => ({ ...f, matricule: v }))}
              />
              <Field
                label="Genre"
                value={form.gender}
                onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                placeholder="M / F"
              />
              <Field
                label="Date de naissance"
                value={form.date_of_birth}
                onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))}
                type="date"
              />
              <Field
                label="Téléphone"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />
              </div>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-red-600">{formError}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCreate}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
      />
    </label>
  );
}
