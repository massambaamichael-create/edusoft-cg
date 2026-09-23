"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
/* =========================================================
   TYPES
========================================================= */

type Cycle = {
  id: string;
  school_id: string | null;
  name: string;
};

type Level = {
  id: string;
  school_id: string;
  cycle_id: string;
  name: string;
};

type SchoolClass = {
  id: string;
  school_id: string | null;
  cycle_id: string | null;
  level_id: string | null;
  name: string;
  academic_year_id: string | null;
};

type Subject = {
  id: string;
  school_id: string | null;
  name: string;
  coefficient: number | null;
  created_at: string | null;
};

type ClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  coefficient: number;
  created_at: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function MatieresPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [schoolId, setSchoolId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("all");

  const [expandedClasses, setExpandedClasses] = useState<
    Record<string, boolean>
  >({});

  const [showModal, setShowModal] = useState(false);

  const [selectedClass, setSelectedClass] =
    useState<SchoolClass | null>(null);

  const [editingSubject, setEditingSubject] =
    useState<Subject | null>(null);

  const [subjectName, setSubjectName] = useState("");
  const [coefficient, setCoefficient] = useState(1);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Utilisateur non connecté.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, school_id")
        .eq("auth_user_id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.school_id) {
        throw new Error(
          "Aucune école n'est associée à votre profil."
        );
      }

      setSchoolId(profile.school_id);

      const [
        cyclesResult,
        levelsResult,
        classesResult,
        subjectsResult,
        classSubjectsResult,
      ] = await Promise.all([
        supabase
          .from("cycles")
          .select("id, school_id, name")
          .eq("school_id", profile.school_id)
          .order("name"),

        supabase
          .from("levels")
          .select("id, school_id, cycle_id, name")
          .eq("school_id", profile.school_id)
          .order("display_order"),

        supabase
          .from("classes")
          .select(
            "id, school_id, cycle_id, level_id, name, academic_year_id"
          )
          .eq("school_id", profile.school_id)
          .order("name"),

        supabase
          .from("subjects")
          .select(
            "id, school_id, name, coefficient, created_at"
          )
          .eq("school_id", profile.school_id)
          .order("name"),

        supabase
          .from("class_subjects")
          .select(
            "id, class_id, subject_id, academic_year_id, coefficient, created_at"
          ),
      ]);

      if (cyclesResult.error) throw cyclesResult.error;
      if (levelsResult.error) throw levelsResult.error;
      if (classesResult.error) throw classesResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      if (classSubjectsResult.error)
        throw classSubjectsResult.error;

      setCycles((cyclesResult.data || []) as Cycle[]);
      setLevels((levelsResult.data || []) as Level[]);
      setClasses((classesResult.data || []) as SchoolClass[]);
      setSubjects((subjectsResult.data || []) as Subject[]);
      setClassSubjects(
        (classSubjectsResult.data || []) as ClassSubject[]
      );
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT MATIÈRES :",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les matières."
      );
    } finally {
      setLoading(false);
    }
  };

  // Data loading synchronizes the page with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getCycleName = (cycleId: string | null) => {
    if (!cycleId) return "Cycle inconnu";

    return (
      cycles.find((cycle) => cycle.id === cycleId)?.name ||
      "Cycle inconnu"
    );
  };

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return "";

    return (
      levels.find((level) => level.id === levelId)?.name ||
      ""
    );
  };

  const getSubjectForClass = (classId: string) => {
    return classSubjects
      .filter((item) => item.class_id === classId)
      .map((item) => ({
        assignment: item,
        subject: subjects.find(
          (subject) => subject.id === item.subject_id
        ),
      }))
      .filter((item) => item.subject);
  };

  /* =========================================================
     CLASSES FILTRÉES
  ========================================================= */

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return classes.filter((schoolClass) => {
      const matchesSearch =
        !term ||
        schoolClass.name.toLowerCase().includes(term) ||
        getCycleName(schoolClass.cycle_id)
          .toLowerCase()
          .includes(term) ||
        getLevelName(schoolClass.level_id)
          .toLowerCase()
          .includes(term);

      const matchesCycle =
        selectedCycle === "all" ||
        schoolClass.cycle_id === selectedCycle;

      return matchesSearch && matchesCycle;
    });
  }, [
    classes,
    cycles,
    levels,
    search,
    selectedCycle,
    classSubjects,
    subjects,
  ]);

  /* =========================================================
     OUVRIR / FERMER UNE CLASSE
  ========================================================= */

  const toggleClass = (classId: string) => {
    setExpandedClasses((previous) => ({
      ...previous,
      [classId]: !previous[classId],
    }));
  };

  /* =========================================================
     MODAL
  ========================================================= */

  const openCreateModal = (schoolClass: SchoolClass) => {
    setSelectedClass(schoolClass);
    setEditingSubject(null);
    setSubjectName("");
    setCoefficient(1);
    setErrorMessage("");
    setSuccessMessage("");
    setShowModal(true);
  };

  const openEditModal = (
    schoolClass: SchoolClass,
    subject: Subject
  ) => {
    setSelectedClass(schoolClass);
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setCoefficient(subject.coefficient || 1);
    setErrorMessage("");
    setSuccessMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedClass(null);
    setEditingSubject(null);
    setSubjectName("");
    setCoefficient(1);
    setErrorMessage("");
    setSuccessMessage("");
  };

  /* =========================================================
     CRÉER / MODIFIER UNE MATIÈRE
  ========================================================= */

  const handleSaveSubject = async () => {
    if (!selectedClass || !schoolId) {
      return;
    }

    const cleanName = subjectName.trim();

    if (!cleanName) {
      setErrorMessage("Veuillez saisir le nom de la matière.");
      return;
    }

    if (!coefficient || coefficient < 1) {
      setErrorMessage(
        "Le coefficient doit être supérieur ou égal à 1."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      /*
       * Une matière est d'abord créée dans subjects.
       * Elle est ensuite rattachée à la classe dans
       * class_subjects.
       */

      if (editingSubject) {
        const { data: updatedSubject, error: subjectError } =
          await supabase
            .from("subjects")
            .update({
              name: cleanName,
              coefficient,
            })
            .eq("id", editingSubject.id)
            .select(
              "id, school_id, name, coefficient, created_at"
            )
            .single();

        if (subjectError) throw subjectError;

        const { data: updatedClassSubject, error: classError } =
          await supabase
            .from("class_subjects")
            .update({
              coefficient,
            })
            .eq("class_id", selectedClass.id)
            .eq("subject_id", editingSubject.id)
            .eq(
              "academic_year_id",
              selectedClass.academic_year_id
            )
            .select(
              "id, class_id, subject_id, academic_year_id, coefficient, created_at"
            )
            .single();

        if (classError) throw classError;

        setSubjects((previous) =>
          previous.map((subject) =>
            subject.id === editingSubject.id
              ? (updatedSubject as Subject)
              : subject
          )
        );

        setClassSubjects((previous) =>
          previous.map((item) =>
            item.id === updatedClassSubject.id
              ? (updatedClassSubject as ClassSubject)
              : item
          )
        );

        setSuccessMessage(
          "La matière a été modifiée avec succès."
        );
      } else {
        /*
         * Vérifier si une matière portant exactement le même
         * nom existe déjà dans l'école.
         */
        const existingSubject = subjects.find(
          (subject) =>
            subject.name.trim().toLowerCase() ===
            cleanName.toLowerCase()
        );

        let subject: Subject;

        if (existingSubject) {
          subject = existingSubject;
        } else {
          const { data: createdSubject, error: subjectError } =
            await supabase
              .from("subjects")
              .insert({
                school_id: schoolId,
                name: cleanName,
                coefficient,
              })
              .select(
                "id, school_id, name, coefficient, created_at"
              )
              .single();

          if (subjectError) throw subjectError;

          subject = createdSubject as Subject;

          setSubjects((previous) => [
            ...previous,
            subject,
          ]);
        }

        /*
         * Une même matière peut être utilisée dans plusieurs
         * classes. La liaison réelle classe ↔ matière est donc
         * stockée dans class_subjects.
         */

        const alreadyAssigned = classSubjects.some(
          (item) =>
            item.class_id === selectedClass.id &&
            item.subject_id === subject.id &&
            item.academic_year_id ===
              selectedClass.academic_year_id
        );

        if (alreadyAssigned) {
          throw new Error(
            "Cette matière est déjà affectée à cette classe."
          );
        }

        const { data: createdClassSubject, error: classError } =
          await supabase
            .from("class_subjects")
            .insert({
              class_id: selectedClass.id,
              subject_id: subject.id,
              academic_year_id:
                selectedClass.academic_year_id,
              coefficient,
            })
            .select(
              "id, class_id, subject_id, academic_year_id, coefficient, created_at"
            )
            .single();

        if (classError) throw classError;

        setClassSubjects((previous) => [
          ...previous,
          createdClassSubject as ClassSubject,
        ]);

        setSuccessMessage(
          "La matière a été ajoutée à la classe."
        );
      }

      setSubjectName("");
      setCoefficient(1);

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "ERREUR ENREGISTREMENT MATIÈRE :",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la matière."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SUPPRIMER LA MATIÈRE DE LA CLASSE
  ========================================================= */

  const handleDeleteSubject = async (
    schoolClass: SchoolClass,
    classSubject: ClassSubject,
    subject: Subject
  ) => {
    const confirmed = window.confirm(
      `Voulez-vous retirer "${subject.name}" de la classe ${schoolClass.name} ?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("class_subjects")
        .delete()
        .eq("id", classSubject.id);

      if (error) throw error;

      setClassSubjects((previous) =>
        previous.filter(
          (item) => item.id !== classSubject.id
        )
      );

      setSuccessMessage(
        `"${subject.name}" a été retirée de ${schoolClass.name}.`
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "ERREUR SUPPRESSION MATIÈRE :",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cette matière."
      );
    }
  };

  /* =========================================================
     RENDU
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
<main className="min-h-screen">
        <div className="px-8 py-8">
          {/* HEADER */}

          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                Gestion pédagogique
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-950">
                Matières
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Configurez les matières et leurs coefficients
                pour chaque classe.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)] transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Actualiser
            </button>
          </div>

          {/* MESSAGES */}

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* FILTRES */}

          <div className="mb-6 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Rechercher une classe..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                />
              </div>

              <div className="relative lg:w-64">
                <select
                  value={selectedCycle}
                  onChange={(event) =>
                    setSelectedCycle(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-400"
                >
                  <option value="all">
                    Tous les cycles
                  </option>

                  {cycles.map((cycle) => (
                    <option
                      key={cycle.id}
                      value={cycle.id}
                    >
                      {cycle.name}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* CONTENU */}

          {loading ? (
            <div className="rounded-[24px] border border-slate-200/80 bg-white py-16 text-center shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]">
              <RefreshCw className="mx-auto h-7 w-7 animate-spin text-indigo-500" />

              <p className="mt-3 text-sm text-slate-500">
                Chargement des matières...
              </p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gray-300" />

              <h2 className="mt-4 text-base font-bold text-slate-900">
                Aucune classe trouvée
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Créez d'abord vos classes dans la page
                Classes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClasses.map((schoolClass) => {
                const assignedSubjects =
                  getSubjectForClass(schoolClass.id);

                const isExpanded =
                  expandedClasses[schoolClass.id] ??
                  true;

                return (
                  <div
                    key={schoolClass.id}
                    className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]"
                  >
                    {/* CLASSE */}

                    <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          toggleClass(schoolClass.id)
                        }
                        className="flex min-w-0 items-center gap-4 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <BookOpen className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-slate-950">
                              {schoolClass.name}
                            </h2>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              {getCycleName(
                                schoolClass.cycle_id
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {getLevelName(
                              schoolClass.level_id
                            ) || "Niveau non défini"}{" "}
                            · {assignedSubjects.length}{" "}
                            matière
                            {assignedSubjects.length > 1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                        {isExpanded ? (
                          <ChevronDown className="ml-auto h-5 w-5 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronDown className="ml-auto h-5 w-5 shrink-0 -rotate-90 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateModal(schoolClass)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter une matière
                      </button>
                    </div>

                    {/* MATIÈRES */}

                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 py-5">
                        {assignedSubjects.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                            <BookOpen className="mx-auto h-6 w-6 text-gray-300" />

                            <p className="mt-2 text-sm font-medium text-slate-500">
                              Aucune matière configurée
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Ajoutez les matières de cette
                              classe.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {assignedSubjects.map(
                              ({
                                assignment,
                                subject,
                              }) => {
                                if (!subject) return null;

                                return (
                                  <div
                                    key={assignment.id}
                                    className="group rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-indigo-100 hover:bg-white hover:shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)]">
                                          <BookOpen className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-bold text-slate-900">
                                            {subject.name}
                                          </p>

                                          <p className="mt-1 text-xs text-slate-400">
                                            Coefficient{" "}
                                            {
                                              assignment.coefficient
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openEditModal(
                                              schoolClass,
                                              subject
                                            )
                                          }
                                          className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                          title="Modifier"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSubject(
                                              schoolClass,
                                              assignment,
                                              subject
                                            )
                                          }
                                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                          title="Retirer"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          MODAL MATIÈRE
      ===================================================== */}

      {showModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[26px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editingSubject
                    ? "Modifier la matière"
                    : "Ajouter une matière"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Classe : {selectedClass.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nom de la matière
                </label>

                <input
                  type="text"
                  value={subjectName}
                  onChange={(event) =>
                    setSubjectName(event.target.value)
                  }
                  placeholder="Ex. Français"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Coefficient
                </label>

                <input
                  type="number"
                  min="1"
                  value={coefficient}
                  onChange={(event) =>
                    setCoefficient(
                      Math.max(
                        1,
                        Number(event.target.value)
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                />
              </div>

              <div className="rounded-xl bg-indigo-50 px-4 py-3">
                <p className="text-xs leading-5 text-indigo-700">
                  Cette matière sera rattachée uniquement à
                  la classe{" "}
                  <strong>{selectedClass.name}</strong>.
                  Elle pourra ensuite être affectée à un
                  enseignant depuis l'équipe pédagogique.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSaveSubject}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {editingSubject
                      ? "Enregistrer"
                      : "Ajouter"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}