"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown, Plus, Save, Route } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Program = {
  id: string;
  name: string | null;
  code: string | null;
  description: string | null;
  status: string;
  cycle_id: string;
  level_id: string;
  series_id: string | null;
  subject_id: string;
};

type Version = {
  id: string;
  version_number: number;
  name: string;
  description: string | null;
  source_type: string;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
};

type Unit = {
  id: string;
  program_version_id: string;
  parent_unit_id: string | null;
  unit_type: string;
  code: string | null;
  title: string;
  description: string | null;
  display_order: number;
  is_required: boolean;
};

export default function ProgrammeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id;

  const [program, setProgram] = useState<Program | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeVersion, setActiveVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [showUnit, setShowUnit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionForm, setVersionForm] = useState({ name: "", source_type: "school", description: "" });
  const [unitForm, setUnitForm] = useState({ unit_type: "chapter", title: "", code: "", description: "", parent_unit_id: "" });

  async function load() {
    setLoading(true);
    setError(null);

    const [{ data: p, error: pe }, { data: v, error: ve }] = await Promise.all([
      supabase.from("programs").select("id,name,code,description,status,cycle_id,level_id,series_id,subject_id").eq("id", id).maybeSingle(),
      supabase.from("program_versions").select("id,version_number,name,description,source_type,status,effective_from,effective_to").eq("program_id", id).order("version_number", { ascending: false }),
    ]);

    if (pe || ve) {
      setError((pe || ve)?.message ?? "Impossible de charger le programme.");
      setLoading(false);
      return;
    }

    setProgram((p as Program | null) ?? null);
    const nextVersions = (v ?? []) as Version[];
    setVersions(nextVersions);
    const nextVersion = activeVersion && nextVersions.some((x) => x.id === activeVersion)
      ? activeVersion
      : nextVersions[0]?.id ?? "";
    setActiveVersion(nextVersion);

    if (nextVersion) {
      const { data: u, error: ue } = await supabase
        .from("program_units")
        .select("id,program_version_id,parent_unit_id,unit_type,code,title,description,display_order,is_required")
        .eq("program_version_id", nextVersion)
        .order("display_order")
        .order("created_at");
      if (ue) setError(ue.message);
      setUnits((u ?? []) as Unit[]);
    } else {
      setUnits([]);
    }

    setLoading(false);
  }

  useEffect(() => { void load(); }, [id]);

  useEffect(() => {
    if (!activeVersion) return;
    const run = async () => {
      const { data, error: e } = await supabase
        .from("program_units")
        .select("id,program_version_id,parent_unit_id,unit_type,code,title,description,display_order,is_required")
        .eq("program_version_id", activeVersion)
        .order("display_order")
        .order("created_at");
      if (e) setError(e.message);
      else setUnits((data ?? []) as Unit[]);
    };
    void run();
  }, [activeVersion]);

  async function createVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!versionForm.name.trim()) return;
    setSaving(true);
    setError(null);

    const nextNumber = (versions[0]?.version_number ?? 0) + 1;
    const { data, error: e2 } = await supabase
      .from("program_versions")
      .insert({
        program_id: id,
        version_number: nextNumber,
        name: versionForm.name.trim(),
        description: versionForm.description.trim() || null,
        source_type: versionForm.source_type,
        status: "draft",
      })
      .select("id")
      .single();

    if (e2) setError(e2.message);
    else {
      setVersionForm({ name: "", source_type: "school", description: "" });
      setShowVersion(false);
      await load();
      if (data?.id) setActiveVersion(data.id);
    }
    setSaving(false);
  }

  async function createUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVersion || !unitForm.title.trim()) return;
    setSaving(true);
    setError(null);

    const { error: e2 } = await supabase.from("program_units").insert({
      program_version_id: activeVersion,
      parent_unit_id: unitForm.parent_unit_id || null,
      unit_type: unitForm.unit_type,
      code: unitForm.code.trim() || null,
      title: unitForm.title.trim(),
      description: unitForm.description.trim() || null,
      display_order: units.length,
      is_required: true,
    });

    if (e2) setError(e2.message);
    else {
      setUnitForm({ unit_type: "chapter", title: "", code: "", description: "", parent_unit_id: "" });
      setShowUnit(false);
      await load();
    }
    setSaving(false);
  }

  if (loading) return <main className="min-h-screen bg-[#F7F8FC] p-8 text-sm text-slate-500">Chargement…</main>;
  if (!program) return <main className="min-h-screen bg-[#F7F8FC] p-8"><button onClick={() => router.back()} className="text-sm text-violet-600">← Retour</button><p className="mt-8 text-slate-600">Programme introuvable.</p></main>;

  const currentVersion = versions.find((v) => v.id === activeVersion);

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8">
      <button onClick={() => router.push("/pedagogie/programmes")} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Programmes
      </button>

      <header className="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><BookOpen className="h-5 w-5" /></div>
              <div>
                <h1 className="text-2xl font-bold text-slate-950">{program.name || "Programme"}</h1>
                {program.code && <p className="text-xs text-slate-400">{program.code}</p>}
              </div>
            </div>
            {program.description && <p className="mt-4 max-w-3xl text-sm text-slate-500">{program.description}</p>}
          </div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{program.status}</span><button onClick={() => router.push(`/pedagogie/programmes/${id}/progression`)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"><Route className="h-4 w-4" /> Gérer la progression</button></div>
        </div>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section id="versions-section" className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h2 className="font-bold text-slate-900">Versions</h2><p className="mt-1 text-xs text-slate-500">{versions.length} version(s)</p></div>
            <button onClick={() => setShowVersion(true)} className="rounded-lg bg-violet-50 p-2 text-violet-600 hover:bg-violet-100"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="mt-5 space-y-2">
            {versions.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucune version. Créez la première version du référentiel.</p>}
            {versions.map((v) => (
              <button key={v.id} onClick={() => setActiveVersion(v.id)} className={`w-full rounded-xl border p-4 text-left ${v.id === activeVersion ? "border-violet-200 bg-violet-50" : "border-slate-100 hover:bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">V{v.version_number} · {v.name}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{v.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{v.source_type}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">{currentVersion ? `V${currentVersion.version_number} · ${currentVersion.name}` : "Unités pédagogiques"}</h2>
              <p className="mt-1 text-xs text-slate-500">Chapitres, notions, compétences et objectifs du référentiel.</p>
            </div>
            <button disabled={!activeVersion} onClick={() => setShowUnit(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Ajouter une unité</button>
          </div>

          {!activeVersion ? (
            <div className="p-12 text-center text-sm text-slate-400">Créez une version pour commencer à structurer le programme.</div>
          ) : units.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">Aucune unité pédagogique dans cette version.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {units.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{u.display_order + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600">{u.unit_type}</span>
                      {u.code && <span className="text-[10px] text-slate-400">{u.code}</span>}
                    </div>
                    <p className="mt-1 font-semibold text-slate-800">{u.title}</p>
                    {u.description && <p className="mt-1 text-xs text-slate-500">{u.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <button onClick={() => setActiveVersion(activeVersion)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Référentiel</p><p className="mt-2 text-sm font-semibold text-slate-800">Informations du programme</p></button>
        <button onClick={() => document.getElementById("versions-section")?.scrollIntoView({ behavior: "smooth" })} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Versions</p><p className="mt-2 text-sm font-semibold text-slate-800">{versions.length} version(s) du référentiel</p></button>
        <button onClick={() => router.push(`/pedagogie/programmes/${id}/progression`)} className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Classes & progression</p><p className="mt-2 text-sm font-semibold text-violet-800">Affecter et suivre les classes →</p></button>
      </section>

      {showVersion && (
        <Modal title="Nouvelle version" onClose={() => setShowVersion(false)}>
          <form onSubmit={createVersion} className="space-y-4">
            <Field label="Nom *"><input className="input" value={versionForm.name} onChange={(e) => setVersionForm({ ...versionForm, name: e.target.value })} placeholder="Ex. Référentiel 2026-2027" /></Field>
            <Field label="Source"><select className="input" value={versionForm.source_type} onChange={(e) => setVersionForm({ ...versionForm, source_type: e.target.value })}><option value="official">Officiel</option><option value="school">Établissement</option><option value="imported">Importé</option><option value="custom">Personnalisé</option></select></Field>
            <Field label="Description"><textarea className="input min-h-24" value={versionForm.description} onChange={(e) => setVersionForm({ ...versionForm, description: e.target.value })} /></Field>
            <Submit saving={saving} label="Créer la version" />
          </form>
        </Modal>
      )}

      {showUnit && (
        <Modal title="Ajouter une unité pédagogique" onClose={() => setShowUnit(false)}>
          <form onSubmit={createUnit} className="space-y-4">
            <Field label="Type *"><select className="input" value={unitForm.unit_type} onChange={(e) => setUnitForm({ ...unitForm, unit_type: e.target.value })}><option value="chapter">Chapitre</option><option value="notion">Notion</option><option value="competency">Compétence</option><option value="objective">Objectif</option></select></Field>
            <Field label="Unité parente"><select className="input" value={unitForm.parent_unit_id} onChange={(e) => setUnitForm({ ...unitForm, parent_unit_id: e.target.value })}><option value="">Aucune</option>{units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}</select></Field>
            <Field label="Titre *"><input className="input" value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} /></Field>
            <Field label="Code"><input className="input" value={unitForm.code} onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })} /></Field>
            <Field label="Description"><textarea className="input min-h-24" value={unitForm.description} onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })} /></Field>
            <Submit saving={saving} label="Ajouter l'unité" />
          </form>
        </Modal>
      )}

      <style jsx>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgb(226 232 240); background: white; padding: 0.625rem 0.875rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: rgb(167 139 250); box-shadow: 0 0 0 3px rgb(237 233 254); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-950">{title}</h2><button type="button" onClick={onClose} className="text-slate-400">×</button></div>{children}</div></div>;
}
function Submit({ saving, label }: { saving: boolean; label: string }) {
  return <div className="flex justify-end pt-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Enregistrement…" : label}</button></div>;
}
