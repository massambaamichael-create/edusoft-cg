"use client";

import { useEffect, useMemo, useState } from "react";
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
      <main className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">Élèves</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Permission <code>students.read</code> requise.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
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
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Nouvel élève
          </button>
        )}
      </header>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, matricule, téléphone…)"
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
        />
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Nouvel élève</h2>
            <p className="mt-1 text-sm text-slate-500">
              Une seule fiche dans <code>students</code>, rattachée à l'école.
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
