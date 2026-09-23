"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";

type Doc = {
  id: string;
  title: string | null;
  document_type: string | null;
  file_url: string | null;
  status: string | null;
  created_at: string | null;
  student_id: string | null;
  verification_code: string | null;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
};

const STATUS: Record<string, string> = {
  draft: "Brouillon",
  submitted: "À valider",
  validated: "Validé",
  rejected: "Rejeté",
  archived: "Archivé",
};

const DOC_TYPES = [
  "Certificat de scolarité",
  "Attestation",
  "Bulletin",
  "Relevé de notes",
  "Convocation",
  "Reçu",
  "Facture",
  "Rapport",
  "Procès-verbal",
  "Courrier",
  "Document administratif",
  "Autre",
];

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function isStoragePath(fileUrl: string | null) {
  if (!fileUrl) return false;
  return !fileUrl.startsWith("http://") && !fileUrl.startsWith("https://");
}

export default function DocumentsPage() {
  const { profile, school, schoolId, role, hasPermission, loading: authLoading } =
    useCurrentUser();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    document_type: "Certificat de scolarité",
    student_id: "",
  });

  const canRead =
    hasPermission("documents.read") ||
    hasPermission("documents.upload") ||
    hasPermission("documents.validate");
  const canValidate = hasPermission("documents.validate");
  const canSubmit = hasPermission("documents.upload");

  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  const filtered = useMemo(
    () =>
      docs.filter((d) => {
        const s = d.student_id ? studentMap.get(d.student_id) : null;
        const hay = [
          d.title,
          d.document_type,
          d.verification_code,
          s?.first_name,
          s?.last_name,
          s?.matricule,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          hay.includes(query.toLowerCase()) &&
          (status === "all" || d.status === status)
        );
      }),
    [docs, query, status, studentMap]
  );

  const stats = useMemo(() => {
    const counts = {
      total: docs.length,
      draft: 0,
      submitted: 0,
      validated: 0,
      archived: 0,
    };
    for (const d of docs) {
      if (d.status === "draft") counts.draft += 1;
      else if (d.status === "submitted") counts.submitted += 1;
      else if (d.status === "validated") counts.validated += 1;
      else if (d.status === "archived") counts.archived += 1;
    }
    return counts;
  }, [docs]);

  const load = useCallback(async () => {
    if (!canRead || !schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("documents")
      .select(
        "id,title,document_type,file_url,status,created_at,student_id,verification_code"
      )
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setDocs((data || []) as Doc[]);

    const { data: studentRows } = await supabase
      .from("students")
      .select("id,first_name,last_name,matricule")
      .eq("school_id", schoolId)
      .order("last_name");

    setStudents((studentRows || []) as Student[]);
    setLoading(false);
  }, [canRead, schoolId]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  async function transition(id: string, to: string) {
    setBusy(id);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("transition_document_workflow", {
      p_document_id: id,
      p_to_status: to,
      p_comment: null,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        to === "validated"
          ? "Document validé."
          : to === "rejected"
            ? "Document rejeté."
            : to === "archived"
              ? "Document archivé."
              : "Document soumis à validation."
      );
      await load();
    }
    setBusy(null);
  }

  async function openFile(doc: Doc) {
    if (!doc.file_url) return;
    if (!isStoragePath(doc.file_url)) {
      window.open(doc.file_url, "_blank", "noopener,noreferrer");
      return;
    }
    setBusy(doc.id);
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 120);
    setBusy(null);
    if (error || !data?.signedUrl) {
      setMessage(error?.message || "Impossible d’ouvrir le fichier.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleCreate() {
    setFormError("");
    if (!schoolId || !profile?.id) {
      setFormError("Session ou école introuvable.");
      return;
    }
    if (!form.title.trim()) {
      setFormError("Le titre est obligatoire.");
      return;
    }
    if (!form.document_type.trim()) {
      setFormError("Le type de document est obligatoire.");
      return;
    }
    if (file) {
      if (!ALLOWED_MIME.includes(file.type)) {
        setFormError(
          "Format non autorisé. PDF, images ou Word uniquement."
        );
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFormError("Fichier trop volumineux (max 15 Mo).");
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();
    const verificationCode = crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase();

    let storagePath: string | null = null;

    if (file) {
      const objectId = crypto.randomUUID();
      const safeName = sanitizeFileName(file.name) || "document.pdf";
      storagePath = `${schoolId}/${objectId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setSaving(false);
        setFormError(uploadError.message);
        return;
      }
    }

    const { error } = await supabase.from("documents").insert({
      school_id: schoolId,
      title: form.title.trim(),
      document_type: form.document_type.trim(),
      student_id: form.student_id || null,
      file_url: storagePath,
      uploaded_by: profile.id,
      status: "draft",
      verification_code: verificationCode,
      stamp_applied: false,
    });

    if (error) {
      if (storagePath) {
        await supabase.storage.from("documents").remove([storagePath]);
      }
      setSaving(false);
      setFormError(error.message);
      return;
    }

    setSaving(false);
    setOpenCreate(false);
    setFile(null);
    setForm({
      title: "",
      document_type: "Certificat de scolarité",
      student_id: "",
    });
    setMessage(
      storagePath
        ? "Document créé en brouillon avec fichier."
        : "Document créé en brouillon."
    );
    await load();
  }

  if (authLoading) {
    return (
      <main className="min-h-full bg-[#F6F7FB] p-8 text-sm text-slate-500">
        Chargement…
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#F6F7FB] px-5 py-7 lg:px-10 lg:py-9">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Documents · Workflows
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Documents
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {school?.name || "EduSoft CG"} ·{" "}
            {role || profile?.first_name || "Utilisateur"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-semibold text-slate-700">
              Accès contrôlé
            </span>
          </div>
          {canSubmit && (
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setFile(null);
                setOpenCreate(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow"
            >
              <Plus className="h-4 w-4" />
              Nouveau document
            </button>
          )}
        </div>
      </header>

      {!canRead ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          Vous n’avez pas la permission d’accéder aux documents.
        </section>
      ) : (
        <>
          <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total", value: stats.total },
              { label: "Brouillons", value: stats.draft },
              { label: "À valider", value: stats.submitted },
              {
                label: "Validés / archivés",
                value: stats.validated + stats.archived,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 lg:p-6">
              <div className="relative min-w-[260px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un document, un élève…"
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
              >
                <option value="all">Tous les statuts</option>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div className="mx-5 mt-4 rounded-[14px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Élève</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Créé</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-400"
                      >
                        Chargement…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-400"
                      >
                        Aucun document.{" "}
                        {canSubmit
                          ? "Créez un brouillon pour démarrer le workflow."
                          : ""}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => {
                      const s = d.student_id
                        ? studentMap.get(d.student_id)
                        : null;
                      const st = d.status || "draft";
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {d.title || d.document_type || "Document"}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {d.document_type || "Document"}
                                  {d.verification_code
                                    ? ` · ${d.verification_code}`
                                    : ""}
                                  {d.file_url ? " · Fichier" : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {s
                              ? [s.first_name, s.last_name]
                                  .filter(Boolean)
                                  .join(" ")
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {st === "validated" ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : st === "rejected" ? (
                                <XCircle className="h-3.5 w-3.5" />
                              ) : (
                                <Clock3 className="h-3.5 w-3.5" />
                              )}
                              {STATUS[st] || st}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {d.created_at
                              ? new Date(d.created_at).toLocaleDateString(
                                  "fr-FR"
                                )
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {d.file_url && (
                                <button
                                  type="button"
                                  disabled={busy === d.id}
                                  onClick={() => void openFile(d)}
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Ouvrir
                                </button>
                              )}
                              {(st === "draft" || st === "rejected") &&
                                canSubmit && (
                                  <button
                                    disabled={busy === d.id}
                                    onClick={() =>
                                      void transition(d.id, "submitted")
                                    }
                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Soumettre
                                  </button>
                                )}
                              {st === "validated" && canValidate && (
                                <button
                                  disabled={busy === d.id}
                                  onClick={() =>
                                    void transition(d.id, "archived")
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  Archiver
                                </button>
                              )}
                              {st === "submitted" && canValidate && (
                                <>
                                  <button
                                    disabled={busy === d.id}
                                    onClick={() =>
                                      void transition(d.id, "validated")
                                    }
                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Valider
                                  </button>
                                  <button
                                    disabled={busy === d.id}
                                    onClick={() =>
                                      void transition(d.id, "rejected")
                                    }
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {openCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Documents · Création
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Nouveau document
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Créé en brouillon, puis soumis à validation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Titre *
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Ex. Certificat de scolarité 2026-2027"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Type *
                </span>
                <select
                  value={form.document_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, document_type: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400 focus:bg-white"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Élève (optionnel)
                </span>
                <select
                  value={form.student_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, student_id: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-400 focus:bg-white"
                >
                  <option value="">— Aucun —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {[s.last_name, s.first_name].filter(Boolean).join(" ")}
                      {s.matricule ? ` · ${s.matricule}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Fichier (optionnel)
                </span>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-slate-300 hover:bg-white">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {file ? file.name : "Choisir un fichier"}
                  </span>
                  <span className="text-xs text-slate-400">
                    PDF, images ou Word · max 15 Mo
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const next = e.target.files?.[0] ?? null;
                      setFile(next);
                    }}
                  />
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Retirer le fichier
                  </button>
                )}
              </div>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-red-600">{formError}</p>
            )}

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
                onClick={() => void handleCreate()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Créer le brouillon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
