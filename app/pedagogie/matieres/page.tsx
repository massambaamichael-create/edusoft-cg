"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

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

type Series = {
  id: string;
  cycle_id: string;
  name: string;
  category: string | null;
};

type SchoolClass = {
  id: string;
  school_id: string | null;
  cycle_id: string | null;
  level_id: string | null;
  series_id: string | null;
  name: string;
  academic_year_id: string | null;
};

type Subject = {
  id: string;
  school_id: string | null;
  name: string;
  code: string | null;
  description: string | null;
  coefficient: number | null;
  is_active: boolean;
  created_at: string | null;
};

type SubjectCurriculum = {
  id: string;
  school_id: string;
  subject_id: string;
  cycle_id: string;
  level_id: string | null;
  series_id: string | null;
  is_active: boolean;
  created_at: string;
};

type ClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  coefficient: number | null;
  hours_per_week: number | null;
  is_active: boolean;
  counts_toward_general_average: boolean;
  max_subject_average: number | null;
};

type ModalType = "subject" | "curriculum" | "class" | null;

export default function MatieresPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curriculums, setCurriculums] = useState<SubjectCurriculum[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedSeries, setSelectedSeries] = useState("all");
  const [activeSection, setActiveSection] = useState<"catalogue" | "classes">(
    "catalogue"
  );

  const [modal, setModal] = useState<ModalType>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [editingCurriculum, setEditingCurriculum] =
    useState<SubjectCurriculum | null>(null);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectCoefficient, setSubjectCoefficient] = useState(1);

  const [curriculumCycle, setCurriculumCycle] = useState("");
  const [curriculumLevel, setCurriculumLevel] = useState("all");
  const [curriculumSeries, setCurriculumSeries] = useState("all");

  const [classCoefficient, setClassCoefficient] = useState(1);
  const [hoursPerWeek, setHoursPerWeek] = useState(0);
  const [countsTowardAverage, setCountsTowardAverage] = useState(true);
  const [maxSubjectAverage, setMaxSubjectAverage] = useState(20);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté.");

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, school_id")
        .eq("auth_user_id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.school_id) {
        throw new Error("Aucune école n'est associée à votre profil.");
      }

      setSchoolId(profile.school_id);

      const [
        cyclesResult,
        levelsResult,
        seriesResult,
        classesResult,
        subjectsResult,
        curriculumsResult,
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
          .from("series")
          .select("id, cycle_id, name, category")
          .order("name"),

        supabase
          .from("classes")
          .select(
            "id, school_id, cycle_id, level_id, series_id, name, academic_year_id"
          )
          .eq("school_id", profile.school_id)
          .order("name"),

        supabase
          .from("subjects")
          .select(
            "id, school_id, name, code, description, coefficient, is_active, created_at"
          )
          .eq("school_id", profile.school_id)
          .order("name"),

        supabase
          .from("subject_curriculums")
          .select(
            "id, school_id, subject_id, cycle_id, level_id, series_id, is_active, created_at"
          )
          .eq("school_id", profile.school_id),

        supabase
          .from("class_subjects")
          .select(
            "id, class_id, subject_id, academic_year_id, coefficient, hours_per_week, is_active, counts_toward_general_average, max_subject_average"
          ),
      ]);

      if (cyclesResult.error) throw cyclesResult.error;
      if (levelsResult.error) throw levelsResult.error;
      if (seriesResult.error) throw seriesResult.error;
      if (classesResult.error) throw classesResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      if (curriculumsResult.error) throw curriculumsResult.error;
      if (classSubjectsResult.error) throw classSubjectsResult.error;

      setCycles((cyclesResult.data || []) as Cycle[]);
      setLevels((levelsResult.data || []) as Level[]);
      setSeries((seriesResult.data || []) as Series[]);
      setClasses((classesResult.data || []) as SchoolClass[]);
      setSubjects((subjectsResult.data || []) as Subject[]);
      setCurriculums(
        (curriculumsResult.data || []) as SubjectCurriculum[]
      );
      setClassSubjects(
        (classSubjectsResult.data || []) as ClassSubject[]
      );
    } catch (error) {
      console.error("ERREUR CHARGEMENT MATIÈRES :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les matières."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCycleName = (cycleId: string | null) =>
    cycles.find((cycle) => cycle.id === cycleId)?.name || "Cycle inconnu";

  const getLevelName = (levelId: string | null) =>
    levels.find((level) => level.id === levelId)?.name || "";

  const getSeriesName = (seriesId: string | null) =>
    series.find((item) => item.id === seriesId)?.name || "";

  const isLycee = (cycleId: string | null) => {
    const name = getCycleName(cycleId).toLowerCase();
    return name.includes("lycée") || name.includes("lycee");
  };

  const getLevelsForCycle = (cycleId: string) =>
    levels.filter((level) => level.cycle_id === cycleId);

  const getSeriesForCycle = (cycleId: string) =>
    series.filter((item) => item.cycle_id === cycleId);

  const filteredLevels = useMemo(() => {
    if (selectedCycle === "all") return levels;
    return levels.filter((level) => level.cycle_id === selectedCycle);
  }, [levels, selectedCycle]);

  const filteredSeries = useMemo(() => {
    if (selectedCycle === "all") return series;
    return series.filter((item) => item.cycle_id === selectedCycle);
  }, [series, selectedCycle]);

  const curriculumAppliesToClass = (
    curriculum: SubjectCurriculum,
    schoolClass: SchoolClass
  ) => {
    if (!curriculum.is_active) return false;
    if (curriculum.cycle_id !== schoolClass.cycle_id) return false;

    const levelMatches =
      curriculum.level_id === null ||
      curriculum.level_id === schoolClass.level_id;

    const seriesMatches =
      curriculum.series_id === null ||
      curriculum.series_id === schoolClass.series_id;

    return levelMatches && seriesMatches;
  };

  const getCurriculumsForSubject = (subjectId: string) =>
    curriculums.filter(
      (item) => item.subject_id === subjectId && item.is_active
    );

  const getApplicableSubjectsForClass = (schoolClass: SchoolClass) =>
    subjects.filter(
      (subject) =>
        subject.is_active &&
        curriculums.some(
          (curriculum) =>
            curriculum.subject_id === subject.id &&
            curriculumAppliesToClass(curriculum, schoolClass)
        )
    );

  const getAssignedSubjectsForClass = (classId: string) => {
    const assignments = classSubjects.filter(
      (item) => item.class_id === classId && item.is_active
    );

    return assignments
      .map((assignment) => ({
        assignment,
        subject: subjects.find(
          (subject) => subject.id === assignment.subject_id
        ),
      }))
      .filter(
        (
          item
        ): item is {
          assignment: ClassSubject;
          subject: Subject;
        } => Boolean(item.subject)
      );
  };

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      if (!subject.is_active) return false;

      const contexts = getCurriculumsForSubject(subject.id);

      const cycleMatches =
        selectedCycle === "all" ||
        contexts.some((context) => context.cycle_id === selectedCycle);

      const levelMatches =
        selectedLevel === "all" ||
        contexts.some(
          (context) =>
            context.cycle_id === selectedCycle &&
            (context.level_id === null || context.level_id === selectedLevel)
        );

      const seriesMatches =
        selectedSeries === "all" ||
        contexts.some(
          (context) =>
            context.cycle_id === selectedCycle &&
            (context.series_id === null ||
              context.series_id === selectedSeries)
        );

      const textMatches =
        !term ||
        subject.name.toLowerCase().includes(term) ||
        (subject.code || "").toLowerCase().includes(term);

      return cycleMatches && levelMatches && seriesMatches && textMatches;
    });
  }, [
    subjects,
    curriculums,
    search,
    selectedCycle,
    selectedLevel,
    selectedSeries,
  ]);

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return classes.filter((schoolClass) => {
      const textMatches =
        !term ||
        schoolClass.name.toLowerCase().includes(term) ||
        getCycleName(schoolClass.cycle_id).toLowerCase().includes(term) ||
        getLevelName(schoolClass.level_id).toLowerCase().includes(term) ||
        getSeriesName(schoolClass.series_id).toLowerCase().includes(term);

      const cycleMatches =
        selectedCycle === "all" ||
        schoolClass.cycle_id === selectedCycle;

      const levelMatches =
        selectedLevel === "all" ||
        schoolClass.level_id === selectedLevel;

      const seriesMatches =
        selectedSeries === "all" ||
        schoolClass.series_id === selectedSeries;

      return textMatches && cycleMatches && levelMatches && seriesMatches;
    });
  }, [
    classes,
    cycles,
    levels,
    series,
    search,
    selectedCycle,
    selectedLevel,
    selectedSeries,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCycle("all");
    setSelectedLevel("all");
    setSelectedSeries("all");
  };

  const openSubjectModal = (subject?: Subject) => {
    clearMessages();
    setEditingSubject(subject || null);
    setSubjectName(subject?.name || "");
    setSubjectCode(subject?.code || "");
    setSubjectDescription(subject?.description || "");
    setSubjectCoefficient(subject?.coefficient || 1);
    setModal("subject");
  };

  const openCurriculumModal = (
    subject: Subject,
    curriculum?: SubjectCurriculum
  ) => {
    clearMessages();
    setSelectedSubject(subject);
    setEditingCurriculum(curriculum || null);
    setCurriculumCycle(
      curriculum?.cycle_id ||
        (cycles[0]?.id ?? "")
    );
    setCurriculumLevel(curriculum?.level_id || "all");
    setCurriculumSeries(curriculum?.series_id || "all");
    setModal("curriculum");
  };

  const openClassModal = (schoolClass: SchoolClass, subject: Subject) => {
    clearMessages();
    const existing = classSubjects.find(
      (item) =>
        item.class_id === schoolClass.id &&
        item.subject_id === subject.id &&
        item.academic_year_id === schoolClass.academic_year_id
    );

    setSelectedClass(schoolClass);
    setSelectedSubject(subject);
    setClassCoefficient(existing?.coefficient || subject.coefficient || 1);
    setHoursPerWeek(existing?.hours_per_week || 0);
    setCountsTowardAverage(existing?.counts_toward_general_average ?? true);
    setMaxSubjectAverage(existing?.max_subject_average || 20);
    setModal("class");
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setEditingSubject(null);
    setSelectedSubject(null);
    setSelectedClass(null);
    setEditingCurriculum(null);
    clearMessages();
  };

  const handleSaveSubject = async () => {
    if (!schoolId) return;

    const cleanName = subjectName.trim();

    if (!cleanName) {
      setErrorMessage("Veuillez saisir le nom de la matière.");
      return;
    }

    if (!subjectCoefficient || subjectCoefficient < 1) {
      setErrorMessage("Le coefficient doit être supérieur ou égal à 1.");
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const duplicate = subjects.find(
        (subject) =>
          subject.id !== editingSubject?.id &&
          subject.name.trim().toLowerCase() === cleanName.toLowerCase()
      );

      if (duplicate) {
        throw new Error(
          "Une matière portant déjà ce nom existe dans le catalogue."
        );
      }

      if (editingSubject) {
        const { data, error } = await supabase
          .from("subjects")
          .update({
            name: cleanName,
            code: subjectCode.trim() || null,
            description: subjectDescription.trim() || null,
            coefficient: subjectCoefficient,
          })
          .eq("id", editingSubject.id)
          .eq("school_id", schoolId)
          .select(
            "id, school_id, name, code, description, coefficient, is_active, created_at"
          )
          .single();

        if (error) throw error;

        setSubjects((previous) =>
          previous.map((subject) =>
            subject.id === editingSubject.id
              ? (data as Subject)
              : subject
          )
        );
        setSuccessMessage("La matière a été modifiée.");
      } else {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            school_id: schoolId,
            name: cleanName,
            code: subjectCode.trim() || null,
            description: subjectDescription.trim() || null,
            coefficient: subjectCoefficient,
            is_active: true,
          })
          .select(
            "id, school_id, name, code, description, coefficient, is_active, created_at"
          )
          .single();

        if (error) throw error;

        setSubjects((previous) =>
          [...previous, data as Subject].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setSuccessMessage(
          "La matière a été créée dans le catalogue. Elle n'est encore rattachée à aucun contexte pédagogique."
        );
      }
    } catch (error) {
      console.error("ERREUR MATIÈRE :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la matière."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurriculum = async () => {
    if (!schoolId || !selectedSubject) return;

    if (!curriculumCycle) {
      setErrorMessage("Veuillez sélectionner un cycle.");
      return;
    }

    const selectedCycleName = getCycleName(curriculumCycle);
    const cycleIsLycee = isLycee(curriculumCycle);

    if (!cycleIsLycee && curriculumSeries !== "all") {
      setErrorMessage("Une série ne peut être utilisée que pour un lycée.");
      return;
    }

    const levelId = curriculumLevel === "all" ? null : curriculumLevel;
    const seriesId =
      cycleIsLycee && curriculumSeries !== "all"
        ? curriculumSeries
        : null;

    if (seriesId) {
      const selectedSeries = series.find((item) => item.id === seriesId);

      if (!selectedSeries || selectedSeries.cycle_id !== curriculumCycle) {
        setErrorMessage(
          "La série sélectionnée n'appartient pas à ce cycle."
        );
        return;
      }
    }

    if (levelId) {
      const selectedLevel = levels.find((item) => item.id === levelId);

      if (!selectedLevel || selectedLevel.cycle_id !== curriculumCycle) {
        setErrorMessage(
          "Le niveau sélectionné n'appartient pas à ce cycle."
        );
        return;
      }
    }

    const duplicate = curriculums.find(
      (item) =>
        item.id !== editingCurriculum?.id &&
        item.subject_id === selectedSubject.id &&
        item.cycle_id === curriculumCycle &&
        item.level_id === levelId &&
        item.series_id === seriesId &&
        item.is_active
    );

    if (duplicate) {
      throw new Error(
        "Ce contexte pédagogique est déjà configuré pour cette matière."
      );
    }

    setSaving(true);
    clearMessages();

    try {
      if (editingCurriculum) {
        const { data, error } = await supabase
          .from("subject_curriculums")
          .update({
            cycle_id: curriculumCycle,
            level_id: levelId,
            series_id: seriesId,
            is_active: true,
          })
          .eq("id", editingCurriculum.id)
          .eq("school_id", schoolId)
          .select(
            "id, school_id, subject_id, cycle_id, level_id, series_id, is_active, created_at"
          )
          .single();

        if (error) throw error;

        setCurriculums((previous) =>
          previous.map((item) =>
            item.id === editingCurriculum.id
              ? (data as SubjectCurriculum)
              : item
          )
        );

        setSuccessMessage(
          `Le contexte « ${selectedCycleName} » a été modifié.`
        );
      } else {
        const { data, error } = await supabase
          .from("subject_curriculums")
          .insert({
            school_id: schoolId,
            subject_id: selectedSubject.id,
            cycle_id: curriculumCycle,
            level_id: levelId,
            series_id: seriesId,
            is_active: true,
          })
          .select(
            "id, school_id, subject_id, cycle_id, level_id, series_id, is_active, created_at"
          )
          .single();

        if (error) throw error;

        setCurriculums((previous) => [
          ...previous,
          data as SubjectCurriculum,
        ]);

        setSuccessMessage(
          "Le contexte pédagogique a été ajouté à la matière."
        );
      }
    } catch (error) {
      console.error("ERREUR CONTEXTE MATIÈRE :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer ce contexte."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCurriculum = async (
    curriculum: SubjectCurriculum,
    subject: Subject
  ) => {
    const levelLabel = curriculum.level_id
      ? getLevelName(curriculum.level_id)
      : "Tous les niveaux";
    const seriesLabel = curriculum.series_id
      ? getSeriesName(curriculum.series_id)
      : "Toutes les séries";

    const confirmed = window.confirm(
      `Retirer « ${subject.name} » du contexte ${getCycleName(
        curriculum.cycle_id
      )} · ${levelLabel} · ${seriesLabel} ?`
    );

    if (!confirmed) return;

    setSaving(true);
    clearMessages();

    try {
      const { error } = await supabase
        .from("subject_curriculums")
        .delete()
        .eq("id", curriculum.id)
        .eq("school_id", schoolId);

      if (error) throw error;

      setCurriculums((previous) =>
        previous.filter((item) => item.id !== curriculum.id)
      );
      setSuccessMessage("Le contexte pédagogique a été retiré.");
    } catch (error) {
      console.error("ERREUR SUPPRESSION CONTEXTE :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de retirer ce contexte."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubject = async (subject: Subject) => {
    if (!schoolId) return;

    const nextActive = !subject.is_active;
    clearMessages();

    try {
      const { data, error } = await supabase
        .from("subjects")
        .update({ is_active: nextActive })
        .eq("id", subject.id)
        .eq("school_id", schoolId)
        .select(
          "id, school_id, name, code, description, coefficient, is_active, created_at"
        )
        .single();

      if (error) throw error;

      setSubjects((previous) =>
        previous.map((item) =>
          item.id === subject.id ? (data as Subject) : item
        )
      );

      setSuccessMessage(
        nextActive
          ? `« ${subject.name} » est de nouveau active.`
          : `« ${subject.name} » a été désactivée du catalogue.`
      );
    } catch (error) {
      console.error("ERREUR STATUT MATIÈRE :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le statut de la matière."
      );
    }
  };

  const handleSaveClassSubject = async () => {
    if (!schoolId || !selectedClass || !selectedSubject) return;

    if (!selectedClass.academic_year_id) {
      setErrorMessage(
        "Cette classe n'est rattachée à aucune année scolaire active."
      );
      return;
    }

    if (!classCoefficient || classCoefficient < 1) {
      setErrorMessage("Le coefficient doit être supérieur ou égal à 1.");
      return;
    }

    if (hoursPerWeek < 0) {
      setErrorMessage("Le nombre d'heures par semaine ne peut pas être négatif.");
      return;
    }

    if (!maxSubjectAverage || maxSubjectAverage <= 0) {
      setErrorMessage("La moyenne maximale doit être supérieure à 0.");
      return;
    }

    const alreadyAssigned = classSubjects.find(
      (item) =>
        item.class_id === selectedClass.id &&
        item.subject_id === selectedSubject.id &&
        item.academic_year_id === selectedClass.academic_year_id
    );

    setSaving(true);
    clearMessages();

    try {
      const payload = {
        school_id: schoolId,
        class_id: selectedClass.id,
        subject_id: selectedSubject.id,
        academic_year_id: selectedClass.academic_year_id,
        coefficient: classCoefficient,
        hours_per_week: hoursPerWeek,
        is_active: true,
        counts_toward_general_average: countsTowardAverage,
        max_subject_average: maxSubjectAverage,
      };

      if (alreadyAssigned) {
        const { data, error } = await supabase
          .from("class_subjects")
          .update(payload)
          .eq("id", alreadyAssigned.id)
          .select(
            "id, class_id, subject_id, academic_year_id, coefficient, hours_per_week, is_active, counts_toward_general_average, max_subject_average"
          )
          .single();

        if (error) throw error;

        setClassSubjects((previous) =>
          previous.map((item) =>
            item.id === alreadyAssigned.id
              ? (data as ClassSubject)
              : item
          )
        );

        setSuccessMessage("La configuration de la matière a été mise à jour.");
      } else {
        const { data, error } = await supabase
          .from("class_subjects")
          .insert(payload)
          .select(
            "id, class_id, subject_id, academic_year_id, coefficient, hours_per_week, is_active, counts_toward_general_average, max_subject_average"
          )
          .single();

        if (error) throw error;

        setClassSubjects((previous) => [
          ...previous,
          data as ClassSubject,
        ]);

        setSuccessMessage(
          `« ${selectedSubject.name} » a été configurée dans ${selectedClass.name}.`
        );
      }
    } catch (error) {
      console.error("ERREUR CONFIGURATION CLASSE :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la configuration de la classe."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromClass = async (
    schoolClass: SchoolClass,
    assignment: ClassSubject,
    subject: Subject
  ) => {
    const confirmed = window.confirm(
      `Retirer « ${subject.name} » de la classe ${schoolClass.name} pour cette année scolaire ?`
    );

    if (!confirmed) return;

    setSaving(true);
    clearMessages();

    try {
      const { error } = await supabase
        .from("class_subjects")
        .delete()
        .eq("id", assignment.id)
        .eq("class_id", schoolClass.id);

      if (error) throw error;

      setClassSubjects((previous) =>
        previous.filter((item) => item.id !== assignment.id)
      );
      setSuccessMessage(
        `« ${subject.name} » a été retirée de ${schoolClass.name}.`
      );
    } catch (error) {
      console.error("ERREUR RETRAIT CLASSE :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de retirer la matière de la classe."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalActiveSubjects = subjects.filter((item) => item.is_active).length;
  const totalContexts = curriculums.filter((item) => item.is_active).length;
  const totalAssignments = classSubjects.filter(
    (item) => item.is_active
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 min-h-screen">
        <div className="px-8 py-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                Gestion pédagogique
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                Matières
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                Gérez le catalogue des matières, leur applicabilité par cycle,
                niveau et série, puis leur configuration concrète dans chaque
                classe.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Actualiser
              </button>

              <button
                type="button"
                onClick={() => openSubjectModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle matière
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="fixed right-6 top-6 z-[100] flex max-w-md items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Catalogue
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {totalActiveSubjects}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    matières actives
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Contextes
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {totalContexts}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    règles d'applicabilité
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Layers3 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Classes
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {totalAssignments}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    configurations actives
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Settings2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveSection("catalogue")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeSection === "catalogue"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              Catalogue & contextes pédagogiques
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("classes")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeSection === "classes"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              Configuration par classe
            </button>
          </div>

          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    activeSection === "catalogue"
                      ? "Rechercher une matière..."
                      : "Rechercher une classe..."
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedCycle}
                  onChange={(event) => {
                    setSelectedCycle(event.target.value);
                    setSelectedLevel("all");
                    setSelectedSeries("all");
                  }}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                >
                  <option value="all">Tous les cycles</option>
                  {cycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                  disabled={selectedCycle === "all"}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">Tous les niveaux</option>
                  {filteredLevels
                    .filter((level) => level.cycle_id === selectedCycle)
                    .map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={selectedSeries}
                  onChange={(event) => setSelectedSeries(event.target.value)}
                  disabled={
                    selectedCycle === "all" || !isLycee(selectedCycle)
                  }
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">
                    {selectedCycle !== "all" && isLycee(selectedCycle)
                      ? "Toutes les séries"
                      : "Série — lycée uniquement"}
                  </option>
                  {filteredSeries
                    .filter((item) => item.cycle_id === selectedCycle)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
              <RefreshCw className="mx-auto h-7 w-7 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm text-gray-500">
                Chargement des matières...
              </p>
            </div>
          ) : activeSection === "catalogue" ? (
            <div className="space-y-4">
              {filteredSubjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
                  <h2 className="mt-4 text-base font-bold text-gray-800">
                    Aucune matière trouvée
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Créez une matière dans le catalogue ou modifiez les filtres.
                  </p>
                </div>
              ) : (
                filteredSubjects.map((subject) => {
                  const subjectContexts = getCurriculumsForSubject(subject.id);

                  return (
                    <div
                      key={subject.id}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <BookOpen className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-bold text-gray-900">
                                {subject.name}
                              </h2>
                              {subject.code && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                  {subject.code}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              Coefficient par défaut :{" "}
                              <strong className="text-gray-600">
                                {subject.coefficient || 1}
                              </strong>{" "}
                              · {subjectContexts.length} contexte
                              {subjectContexts.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openSubjectModal(subject)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => openCurriculumModal(subject)}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter un contexte
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSubject(subject)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
                          >
                            {subject.is_active ? "Désactiver" : "Activer"}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-5">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Applicabilité pédagogique
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              Définit où cette matière peut être proposée.
                            </p>
                          </div>
                        </div>

                        {subjectContexts.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center">
                            <Layers3 className="mx-auto h-6 w-6 text-gray-300" />
                            <p className="mt-2 text-sm font-medium text-gray-500">
                              Aucun contexte configuré
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              La matière existe dans le catalogue, mais n'est
                              encore applicable à aucune classe.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {subjectContexts.map((context) => (
                              <div
                                key={context.id}
                                className="rounded-xl border border-gray-100 bg-white p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800">
                                      {getCycleName(context.cycle_id)}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {context.level_id
                                        ? getLevelName(context.level_id)
                                        : "Tous les niveaux"}
                                      {isLycee(context.cycle_id) && (
                                        <>
                                          {" · "}
                                          {context.series_id
                                            ? getSeriesName(context.series_id)
                                            : "Toutes les séries"}
                                        </>
                                      )}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openCurriculumModal(subject, context)
                                      }
                                      className="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                      title="Modifier le contexte"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteCurriculum(
                                          context,
                                          subject
                                        )
                                      }
                                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                      title="Retirer le contexte"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClasses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                  <Settings2 className="mx-auto h-10 w-10 text-gray-300" />
                  <h2 className="mt-4 text-base font-bold text-gray-800">
                    Aucune classe trouvée
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Modifiez les filtres ou créez d'abord vos classes.
                  </p>
                </div>
              ) : (
                filteredClasses.map((schoolClass) => {
                  const assignedSubjects = getAssignedSubjectsForClass(
                    schoolClass.id
                  );
                  const applicableSubjects = getApplicableSubjectsForClass(
                    schoolClass
                  );
                  const availableSubjects = applicableSubjects.filter(
                    (subject) =>
                      !assignedSubjects.some(
                        ({ subject: assigned }) =>
                          assigned.id === subject.id
                      )
                  );

                  return (
                    <div
                      key={schoolClass.id}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-bold text-gray-900">
                                {schoolClass.name}
                              </h2>
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                {getCycleName(schoolClass.cycle_id)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              {getLevelName(schoolClass.level_id) ||
                                "Niveau non défini"}
                              {schoolClass.series_id && (
                                <>
                                  {" · "}
                                  {getSeriesName(schoolClass.series_id)}
                                </>
                              )}
                              {" · "}
                              {assignedSubjects.length} matière
                              {assignedSubjects.length > 1 ? "s" : ""} configurée
                              {assignedSubjects.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Matières disponibles
                          </p>
                          <p className="mt-1 text-lg font-bold text-indigo-600">
                            {availableSubjects.length}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 px-5 py-5">
                        {assignedSubjects.length === 0 ? (
                          <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                            <p className="text-sm font-medium text-gray-500">
                              Aucune matière configurée dans cette classe
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              Seules les matières applicables à son contexte
                              apparaîtront ci-dessous.
                            </p>
                          </div>
                        ) : (
                          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {assignedSubjects.map(({ assignment, subject }) => (
                              <div
                                key={assignment.id}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                                      <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-gray-800">
                                        {subject.name}
                                      </p>
                                      <p className="mt-1 text-xs text-gray-400">
                                        Coef. {assignment.coefficient || 1}
                                        {" · "}
                                        {assignment.hours_per_week || 0} h/sem.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openClassModal(schoolClass, subject)
                                      }
                                      className="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                      title="Configurer"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveFromClass(
                                          schoolClass,
                                          assignment,
                                          subject
                                        )
                                      }
                                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                      title="Retirer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {availableSubjects.length > 0 && (
                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <Plus className="h-4 w-4 text-indigo-500" />
                              <p className="text-sm font-bold text-gray-800">
                                Ajouter une matière applicable
                              </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              {availableSubjects.map((subject) => (
                                <button
                                  key={subject.id}
                                  type="button"
                                  onClick={() =>
                                    openClassModal(schoolClass, subject)
                                  }
                                  className="group rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                        <Plus className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-indigo-700">
                                          {subject.name}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400">
                                          Coef. défaut{" "}
                                          {subject.coefficient || 1}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 -rotate-90 text-gray-300 transition group-hover:text-indigo-500" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {availableSubjects.length === 0 &&
                          assignedSubjects.length > 0 && (
                            <div className="rounded-xl bg-emerald-50 px-4 py-3">
                              <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <Check className="h-4 w-4" />
                                Toutes les matières applicables sont configurées
                                pour cette classe.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {modal === "subject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingSubject
                    ? "Modifier la matière"
                    : "Nouvelle matière"}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Catalogue central des matières
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nom de la matière
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="Ex. Mathématiques"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Code
                  </label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(event) => setSubjectCode(event.target.value)}
                    placeholder="Ex. MATH"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Coefficient par défaut
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={subjectCoefficient}
                    onChange={(event) =>
                      setSubjectCoefficient(
                        Math.max(1, Number(event.target.value))
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={subjectDescription}
                  onChange={(event) =>
                    setSubjectDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Description facultative..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                />
              </div>

              <div className="rounded-xl bg-indigo-50 px-4 py-3">
                <p className="text-xs leading-5 text-indigo-700">
                  La création ici ajoute uniquement la matière au{" "}
                  <strong>catalogue</strong>. Son cycle, son niveau et sa série
                  sont configurés séparément.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                    <Check className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "curriculum" && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCurriculum
                    ? "Modifier le contexte"
                    : "Ajouter un contexte"}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Matière : {selectedSubject.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Cycle
                </label>
                <select
                  value={curriculumCycle}
                  onChange={(event) => {
                    setCurriculumCycle(event.target.value);
                    setCurriculumLevel("all");
                    setCurriculumSeries("all");
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Sélectionner un cycle</option>
                  {cycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Niveau
                </label>
                <select
                  value={curriculumLevel}
                  onChange={(event) =>
                    setCurriculumLevel(event.target.value)
                  }
                  disabled={!curriculumCycle}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
                >
                  <option value="all">Tous les niveaux</option>
                  {curriculumCycle &&
                    getLevelsForCycle(curriculumCycle).map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                </select>
              </div>

              {curriculumCycle && isLycee(curriculumCycle) && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Série
                  </label>
                  <select
                    value={curriculumSeries}
                    onChange={(event) =>
                      setCurriculumSeries(event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="all">Toutes les séries</option>
                    {getSeriesForCycle(curriculumCycle).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-xl bg-violet-50 px-4 py-3">
                <p className="text-xs leading-5 text-violet-700">
                  Un niveau non sélectionné signifie{" "}
                  <strong>tous les niveaux</strong> du cycle. Au lycée, une
                  série non sélectionnée signifie{" "}
                  <strong>toutes les séries</strong> de ce cycle.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveCurriculum}
                disabled={saving || !curriculumCycle}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (