"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional data loading */

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Ref = { id: string; name: string; cycle_id?: string | null };
type Program = {
  id: string;
  code: string | null;
  name: string | null;
  status: string;
  cycle_id: string;
  level_id: string;
  series_id: string | null;
  subject_id: string;
};

export default function ProgrammesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cycles, setCycles] = useState<Ref[]>([]);
  const [levels, setLevels] = useState<Ref[]>([]);
  const [series, setSeries] = useState<Ref[]>([]);
  const [subjects, setSubjects] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    cycle_id: "",
    level_id: "",
    series_id: "",
    subject_id: "",
    code: "",
    name: "",
    description: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);

    const [programsRes, cyclesRes, levelsRes, seriesRes, subjectsRes] =
      await Promise.all([
        supabase
          .from("programs")
          .select("id,code,name,status,cycle_id,level_id,series_id,subject_id")
          .order("created_at", { ascending: false }),
        supabase.from("cycles").select("id,name").order("name"),
        supabase.from("levels").select("id,name,cycle_id").order("display_order").order("name"),
        supabase.from("series").select("id,name,cycle_id").order("name"),
        supabase.from("subjects").select("id,name").order("name"),
      ]);

    const firstError =
      programsRes.error ||
      cyclesRes.error ||
      levelsRes.error ||
      seriesRes.error ||
      subjectsRes.error;

    if (firstError) setError(firstError.message);
    else {
      setPrograms((programsRes.data ?? []) as Program[]);
      setCycles((cyclesRes.data ?? []) as Ref[]);
      setLevels((levelsRes.data ?? []) as Ref[]);
      setSeries((seriesRes.data ?? []) as Ref[]);
      setSubjects((subjectsRes.data ?? []) as Ref[]);
    }

    setLoading(false);
  };

  // Data loading synchronizes the page with Supabase.
  useEffect(() => {
    void load();
  }, []);

  const selectedCycle = cycles.find((c) => c.id === form.cycle_id);
  const needsSeries = selectedCycle?.name === "Lycée général" || selectedCycle?.name === "Lycée technique";

  const availableLevels = useMemo(
    () => levels.filter((l) => l.cycle_id === form.cycle_id),
    [levels, form.cycle_id]
  );
  const availableSeries = useMemo(
    () => series.filter((s) => s.cycle_id === form.cycle_id),
    [series, form.cycle_id]
  );

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (cycleFilter && p.cycle_id !== cycleFilter) return false;
      if (!q) return true;
      const text = [p.code, p.name, subjectName(p.subject_id), levelName(p.level_id), seriesName(p.series_id)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [programs, search, cycleFilter, cycles, levels, series, subjects]);

  function cycleName(id: string) {
    return cycles.find((x) => x.id === id)?.name ?? "—";
  }
  function subjectName(id: string) {
    return subjects.find((x) => x.id === id)?.name ?? "—";
  }
  function levelName(id: string) {
    return levels.find((x) => x.id === id)?.name ?? "—";
  }
  function seriesName(id: string | null) {
    return id ? series.find((x) => x.id === id)?.name ?? "—" : "—";
  }

  function resetForm() {
    setForm({
      cycle_id: "",
      level_id: "",
      series_id: "",
      subject_id: "",
      code: "",
      name: "",
      description: "",
    });
  }

  function changeCycle(value: string) {
    setForm((f) => ({ ...f, cycle_id: value, level_id: "", series_id: "" }));
  }

  async function createProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cycle_id || !form.level_id || !form.subject_id) {
      setError("Cycle, niveau et matière sont obligatoires.");
      return;
    }
    if (needsSeries && !form.series_id) {
      setError("Une série/filière est obligatoire pour le lycée.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("programs").insert({
      cycle_id: form.cycle_id,
      level_id: form.level_id,
      series_id: needsSeries ? form.series_id : null,
      subject_id: form.subject_id,
      code: form.code.trim() || null,
      name: form.name.trim() || `Programme ${levelName(form.level_id)} — ${subjectName(form.subject_id)}`,
      description: form.description.trim() || null,
      status: "draft",
    });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Un programme existe déjà pour ce contexte pédagogique et cette matière."
          : insertError.message
      );
    } else {
      resetForm();
      setShowCreate(false);
      await load();
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 lg:p-8">
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600">Référentiel pédagogique</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Programmes & Progression</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Construisez et pilotez les programmes par contexte pédagogique. Un programme est partagé entre les classes qui utilisent le même référentiel.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(null); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau programme
        </button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric icon={<BookOpen className="h-5 w-5" />} label="Programmes" value={programs.length} />
        <Metric icon={<Layers3 className="h-5 w-5" />} label="Versions" value="À construire" />
        <Metric icon={<ChevronRight className="h-5 w-5" />} label="Progressions" value="À construire" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un programme, niveau, série ou matière…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none"
          >
            <option value="">Tous les cycles</option>
            {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Chargement des programmes…</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-base font-semibold text-slate-800">Aucun programme</h2>
            <p className="mt-1 text-sm text-slate-500">Commencez par créer le référentiel d'un niveau et d'une matière.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100">
                  {["Contexte", "Matière", "Programme", "Statut", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{cycleName(p.cycle_id)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {levelName(p.level_id)}
                        {p.series_id ? ` · ${seriesName(p.series_id)}` : ""}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-700">{subjectName(p.subject_id)}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-800">{p.name || "Programme sans nom"}</div>
                      {p.code && <div className="mt-1 text-xs text-slate-400">{p.code}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{p.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => router.push(`/pedagogie/programmes/${p.id}`)} className="rounded-lg px-3 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50">Ouvrir →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Créer un programme</h2>
                <p className="mt-1 text-sm text-slate-500">Le contexte est enregistré une seule fois et pourra être réutilisé par plusieurs classes.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={createProgram} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Cycle *">
                  <select value={form.cycle_id} onChange={(e) => changeCycle(e.target.value)} className="input">
                    <option value="">Sélectionner…</option>
                    {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Niveau *">
                  <select value={form.level_id} onChange={(e) => setForm({ ...form, level_id: e.target.value })} className="input" disabled={!form.cycle_id}>
                    <option value="">Sélectionner…</option>
                    {availableLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={needsSeries ? "Série / Filière *" : "Série / Filière"}>
                  <select value={form.series_id} onChange={(e) => setForm({ ...form, series_id: e.target.value })} className="input" disabled={!needsSeries}>
                    <option value="">{needsSeries ? "Sélectionner…" : "Non applicable"}</option>
                    {availableSeries.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Matière *">
                  <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="input">
                    <option value="">Sélectionner…</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Code">
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" placeholder="Ex. MATH-3E" />
                </Field>
                <Field label="Nom du programme">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nom lisible du référentiel" />
                </Field>
              </div>

              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-24" placeholder="Objectifs, source ou contexte du programme…" />
              </Field>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Annuler</button>
                <button disabled={saving} type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? "Enregistrement…" : "Créer le programme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgb(226 232 240); background: white; padding: 0.625rem 0.875rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: rgb(167 139 250); box-shadow: 0 0 0 3px rgb(237 233 254); }
      `}</style>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">{icon}</div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
