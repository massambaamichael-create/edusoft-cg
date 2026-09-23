"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Plus, Search, ShieldCheck, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";
import {
  createParent,
  fetchParentsForSchool,
  fetchStudentParentLinks,
  linkStudentParent,
  parentDisplayName,
  type ParentRow,
} from "@/lib/administration/parents";
import {
  fetchStudentsForSchool,
  studentDisplayName,
  type StudentRow,
} from "@/lib/administration/students";

export default function AdministrationParentsPage() {
  const { schoolId, school, hasPermission, loading: userLoading } =
    useCurrentUser();
  const canRead =
    hasPermission("parents.read") || hasPermission("parents.manage");
  const canManage = hasPermission("parents.manage");

  const [parents, setParents] = useState<ParentRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [linkForm, setLinkForm] = useState({
    parent_id: "",
    student_id: "",
    relationship: "Parent",
  });

  const reload = async () => {
    if (!schoolId) return;
    const supabase = createClient();
    const [pRes, lRes, sRes] = await Promise.all([
      fetchParentsForSchool(supabase, schoolId),
      fetchStudentParentLinks(supabase, schoolId),
      fetchStudentsForSchool(supabase, schoolId),
    ]);
    setParents(pRes.data);
    setStudents(sRes.data);
    setError(pRes.error || lRes.error || sRes.error);

    const counts: Record<string, number> = {};
    for (const link of lRes.data) {
      counts[link.parent_id] = (counts[link.parent_id] || 0) + 1;
    }
    setLinkCounts(counts);
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
    if (!term) return parents;
    return parents.filter((p) => {
      const blob = [p.first_name, p.last_name, p.phone, p.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [parents, q]);

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
    const result = await createParent(supabase, {
      school_id: schoolId,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email,
    });
    setSaving(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setOpenCreate(false);
    setForm({ first_name: "", last_name: "", phone: "", email: "" });
    await reload();
  };

  const handleLink = async () => {
    setFormError("");
    if (!linkForm.parent_id || !linkForm.student_id) {
      setFormError("Choisissez un parent et un élève.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const result = await linkStudentParent(
      supabase,
      linkForm.student_id,
      linkForm.parent_id,
      linkForm.relationship
    );
    setSaving(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setOpenLink(false);
    setLinkForm({ parent_id: "", student_id: "", relationship: "Parent" });
    await reload();
  };

  if (!userLoading && !canRead) {
    return (
      <main className="min-h-full bg-[#F6F7FB] px-5 py-7 lg:px-10 lg:py-9">
        <h1 className="text-2xl font-bold text-slate-900">Parents</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Permission <code>parents.read</code> requise.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 lg:px-10">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400"><Users className="h-4 w-4" /> Administration · Référentiel</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Parents & tuteurs</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Un parent, plusieurs enfants via{" "}
            <code className="text-slate-700">student_parents</code>
            {school?.name ? ` · ${school.name}` : ""}.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpenLink(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
            >
              Lier parent ↔ élève
            </button>
            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow"
            >
              Nouveau parent
            </button>
          </div>
        )}
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Parents enregistrés</p><p className="mt-2 text-2xl font-bold text-slate-950">{parents.length}</p></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Enfants liés</p><p className="mt-2 text-2xl font-bold text-slate-950">{Object.values(linkCounts).reduce((sum, count) => sum + count, 0)}</p></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Avec contact</p><p className="mt-2 text-2xl font-bold text-slate-950">{parents.filter((p) => Boolean(p.phone || p.email)).length}</p></div></section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm"><div><p className="text-sm font-bold text-slate-900">Répertoire des responsables</p><p className="mt-0.5 text-xs text-slate-400">Source : parents + student_parents</p></div><div className="relative w-full sm:w-[320px]"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un parent…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
        />
      </div></div>

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
        <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3.5 font-bold">Parent</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Enfants liés</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="group border-b border-slate-50 last:border-0 transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
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

      {openCreate && (
        <Modal title="Nouveau parent" onClose={() => setOpenCreate(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
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
              label="Téléphone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
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
        </Modal>
      )}

      {openLink && (
        <Modal title="Lier parent ↔ élève" onClose={() => setOpenLink(false)}>
          <p className="mb-3 text-sm text-slate-500">
            Même parent peut être lié à plusieurs élèves (fratrie).
          </p>
          <div className="grid gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Parent</span>
              <select
                value={linkForm.parent_id}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, parent_id: e.target.value }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3"
              >
                <option value="">— Choisir —</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {parentDisplayName(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Élève</span>
              <select
                value={linkForm.student_id}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, student_id: e.target.value }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3"
              >
                <option value="">— Choisir —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {studentDisplayName(s)}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Lien"
              value={linkForm.relationship}
              onChange={(v) =>
                setLinkForm((f) => ({ ...f, relationship: v }))
              }
              placeholder="Parent, Tuteur, Mère…"
            />
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenLink(false)}
              className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleLink}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Liaison…" : "Lier"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400"
      />
    </label>
  );
}
