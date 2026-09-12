"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadClassTeamData,
  type ClassTeamData,
  type ClassTeamSubject,
} from "@/lib/pedagogie/classTeam";
import {
  saveTeacherAssignment,
  type TeacherAssignment,
} from "@/lib/pedagogie/teacherAssignments";

export type ClassTeamTeacher = {
  id: string;
  employee_number?: string | null;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
};

export type ClassTeamSubjectOption = {
  id: string;
  name: string;
};

type ClassTeamPanelProps = {
  classId: string | null;
  academicYearId: string | null;
  schoolId: string | null;
  className?: string;
  cycleName?: string;
  teachers: ClassTeamTeacher[];
  subjects: ClassTeamSubjectOption[];
  onPrincipalTeacherChange?: (teacherId: string) => Promise<void> | void;
};

function teacherName(teacher: ClassTeamTeacher) {
  const name = `${teacher.user?.first_name ?? ""} ${teacher.user?.last_name ?? ""}`.trim();
  return name || teacher.user?.email || teacher.employee_number || "Enseignant";
}

export default function ClassTeamPanel({
  classId,
  academicYearId,
  schoolId,
  className,
  cycleName,
  teachers,
  subjects,
  onPrincipalTeacherChange,
}: ClassTeamPanelProps) {
  const [data, setData] = useState<ClassTeamData>({
    classSubjects: [],
    teacherAssignments: [],
  });
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!classId || !academicYearId) {
        setData({ classSubjects: [], teacherAssignments: [] });
        return;
      }

      setLoading(true);
      setError("");
      try {
        const next = await loadClassTeamData({ classId, academicYearId });
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger l'équipe pédagogique.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [classId, academicYearId]);

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const assignmentByClassSubject = useMemo(() => {
    const map = new Map<string, TeacherAssignment>();
    data.teacherAssignments.forEach((assignment) => {
      map.set(assignment.class_subject_id, assignment);
    });
    return map;
  }, [data.teacherAssignments]);

  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers]
  );

  async function handleTeacherChange(classSubject: ClassTeamSubject, teacherId: string) {
    if (!schoolId || !academicYearId) return;

    setSavingId(classSubject.id);
    setError("");
    try {
      const assignment = assignmentByClassSubject.get(classSubject.id);
      const saved = await saveTeacherAssignment({
        assignment,
        teacherId,
        schoolId,
        academicYearId,
        classSubjectId: classSubject.id,
        isPrimaryTeacher: cycleName?.toLowerCase() === "primaire",
      });

      setData((current) => {
        const withoutCurrent = current.teacherAssignments.filter(
          (item) => item.id !== saved.id && item.class_subject_id !== classSubject.id
        );
        return {
          ...current,
          teacherAssignments: [...withoutCurrent, saved],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'affectation.");
    } finally {
      setSavingId(null);
    }
  }

  if (!classId) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Équipe pédagogique</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{className || "Classe sélectionnée"}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Les enseignants sont affectés aux matières de cette classe pour l’année scolaire active.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          {data.classSubjects.length} matière{data.classSubjects.length > 1 ? "s" : ""}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
          Chargement de l’équipe pédagogique…
        </div>
      ) : data.classSubjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
          Aucune matière n’est encore associée à cette classe.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)] gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Matière</span>
            <span>Enseignant affecté</span>
          </div>

          <div className="divide-y divide-white/10">
            {data.classSubjects.map((classSubject) => {
              const subject = subjectMap.get(classSubject.subject_id);
              const assignment = assignmentByClassSubject.get(classSubject.id);
              const selectedTeacher = assignment ? teacherMap.get(assignment.teacher_id) : undefined;

              return (
                <div key={classSubject.id} className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{subject?.name || "Matière inconnue"}</p>
                    <p className="mt-1 text-xs text-slate-500">Coefficient {classSubject.coefficient}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={assignment?.teacher_id ?? ""}
                      disabled={savingId === classSubject.id}
                      onChange={(event) => void handleTeacherChange(classSubject, event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Aucun enseignant</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacherName(teacher)}
                        </option>
                      ))}
                    </select>
                    {selectedTeacher && savingId !== classSubject.id && (
                      <span className="hidden text-xs text-emerald-300 lg:inline">Affecté</span>
                    )}
                    {savingId === classSubject.id && (
                      <span className="text-xs text-slate-400">Enregistrement…</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cycleName?.toLowerCase() === "primaire" && onPrincipalTeacherChange && (
        <div className="mt-5 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4">
          <p className="text-sm font-semibold text-white">Professeur principal</p>
          <p className="mt-1 text-xs text-slate-400">Au Primaire, le professeur principal porte l’affectation de la classe.</p>
          <select
            className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60"
            value={
              data.teacherAssignments.find((assignment) => assignment.is_primary_teacher)?.teacher_id ?? ""
            }
            onChange={(event) => void onPrincipalTeacherChange(event.target.value)}
          >
            <option value="">Aucun professeur principal</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacherName(teacher)}</option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
