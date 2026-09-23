"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ClipboardList, GraduationCap, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Assignment = {
  id: string;
  class_subject_id: string;
  academic_year_id: string;
  status: string;
};

type ClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
};

type SchoolClass = {
  id: string;
  name: string;
  academic_year_id: string;
  cycle_id: string;
  level_id: string;
  series_id: string | null;
};

type Subject = {
  id: string;
  name: string;
};

type Program = {
  id: string;
  name: string;
  code: string | null;
  cycle_id: string;
  level_id: string;
  series_id: string | null;
  subject_id: string;
  status: string;
};

type Row = {
  assignmentId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  academicYearId: string;
  program: Program | null;
};

export default function EnseignantProgrammesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/");
        return;
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .single();

      if (userError) throw userError;

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (!teacher) {
        setRows([]);
        return;
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from("teacher_assignments")
        .select("id,class_subject_id,academic_year_id,status")
        .eq("teacher_id", teacher.id)
        .eq("status", "active");

      if (assignmentsError) throw assignmentsError;

      const activeAssignments = (assignments ?? []) as Assignment[];

      if (!activeAssignments.length) {
        setRows([]);
        return;
      }

      const classSubjectIds = activeAssignments.map((item) => item.class_subject_id);

      const { data: classSubjects, error: classSubjectsError } = await supabase
        .from("class_subjects")
        .select("id,class_id,subject_id,academic_year_id")
        .in("id", classSubjectIds);

      if (classSubjectsError) throw classSubjectsError;

      const classSubjectRows = (classSubjects ?? []) as ClassSubject[];
      const classIds = [...new Set(classSubjectRows.map((item) => item.class_id))];
      const subjectIds = [...new Set(classSubjectRows.map((item) => item.subject_id))];

      const [{ data: classes, error: classesError }, { data: subjects, error: subjectsError }, { data: programs, error: programsError }] =
        await Promise.all([
          supabase
            .from("classes")
            .select("id,name,academic_year_id,cycle_id,level_id,series_id")
            .in("id", classIds),
          supabase
            .from("subjects")
            .select("id,name")
            .in("id", subjectIds),
          supabase
            .from("programs")
            .select("id,name,code,cycle_id,level_id,series_id,subject_id,status")
            .in("subject_id", subjectIds)
            .eq("status", "published"),
        ]);

      if (classesError) throw classesError;
      if (subjectsError) throw subjectsError;
      if (programsError) throw programsError;

      const classMap = new Map((classes ?? []).map((item) => [item.id, item as SchoolClass]));
      const subjectMap = new Map((subjects ?? []).map((item) => [item.id, item as Subject]));
      const programRows = (programs ?? []) as Program[];

      const result: Row[] = activeAssignments.flatMap((assignment) => {
        const classSubject = classSubjectRows.find((item) => item.id === assignment.class_subject_id);
        if (!classSubject) return [];

        const classRow = classMap.get(classSubject.class_id);
        const subject = subjectMap.get(classSubject.subject_id);
        if (!classRow || !subject) return [];

        const program =
          programRows.find(
            (item) =>
              item.subject_id === subject.id &&
              item.cycle_id === classRow.cycle_id &&
              item.level_id === classRow.level_id &&
              (item.series_id ?? null) === (classRow.series_id ?? null)
          ) ?? null;

        return [
          {
            assignmentId: assignment.id,
            classId: classRow.id,
            className: classRow.name,
            subjectId: subject.id,
            subjectName: subject.name,
            academicYearId: assignment.academic_year_id,
            program,
          },
        ];
      });

      setRows(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger vos programmes."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter((row) =>
      [row.className, row.subjectName, row.program?.name ?? "", row.program?.code ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, rows]);

  return (
    <main className="min-h-full bg-[#F6F7FB] p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-slate-500">Espace Enseignant</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            Programmes & progression
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Consultez les programmes associés à vos affectations et ouvrez le
            suivi de progression classe par classe.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Kpi
            icon={GraduationCap}
            label="Classes"
            value={new Set(rows.map((row) => row.classId)).size}
          />
          <Kpi
            icon={BookOpen}
            label="Matières"
            value={new Set(rows.map((row) => row.subjectId)).size}
          />
          <Kpi
            icon={ClipboardList}
            label="Programmes disponibles"
            value={rows.filter((row) => row.program).length}
          />
        </div>

        {error && (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Mes programmes</h2>
              <p className="mt-1 text-xs text-slate-500">
                Seules vos affectations pédagogiques actives sont affichées.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une classe ou matière…"
                className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Chargement de vos programmes…
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun programme disponible
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {rows.length
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Aucune affectation pédagogique active n’est disponible pour votre compte."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <article
                  key={row.assignmentId}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-slate-100">
                        <GraduationCap className="h-4 w-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{row.className}</p>
                        <p className="text-xs text-slate-500">{row.subjectName}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {row.program ? (
                        <>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {row.program.name}
                          </span>
                          {row.program.code && (
                            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                              {row.program.code}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Programme non configuré
                        </span>
                      )}
                    </div>
                  </div>

                  {row.program ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/enseignant/programmes/${row.program!.id}?classId=${row.classId}&yearId=${row.academicYearId}`
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Voir la progression
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      En attente de configuration
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}
