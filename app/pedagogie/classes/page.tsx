"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
/* =========================================================
   TYPES
========================================================= */

type Cycle = {
  id: string;
  school_id: string;
  name: string;
  created_at: string;
};

type Level = {
  id: string;
  school_id: string;
  cycle_id: string;
  name: string;
  display_order: number;
  is_state_exam: boolean;
  created_at: string;
};

type Series = {
  id: string;
  school_id: string;
  cycle_id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
};

type AcademicYear = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

type SchoolClass = {
  id: string;
  school_id: string;
  cycle_id: string;
  level_id: string | null;
  series_id: string | null;
  academic_year_id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  principal_teacher_id: string | null;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
};

type StudentEnrollment = {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
};

type Student = {
  id: string;
  school_id: string;
};

type Teacher = {
  id: string;
  school_id: string | null;
  user_id: string | null;
  employee_number: string | null;
};

type TeacherUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type Subject = {
  id: string;
  school_id: string;
  name: string;
  coefficient: number | null;
  created_at: string;
};

type ClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  coefficient: number;
  created_at: string;
};

type TeacherSubject = {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  academic_year_id: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  auth_user_id: string;
  school_id: string;
  role_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roles: {
    name: string;
  } | null;
};

type ClassView = SchoolClass & {
  levelName: string;
  seriesName: string;
  cycleName: string;
  studentCount: number;
  principalTeacherName: string;
};

type CycleFilter =
  | "all"
  | "Primaire"
  | "Collège"
  | "Lycée général"
  | "Lycée technique";

type ImportRow = {
  name: string;
  cycle: string;
  level: string;
  series?: string;
};

/* =========================================================
   CONSTANTES
========================================================= */

const NAVIGATION = [
  {
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    label: "Administration",
    icon: ShieldCheck,
  },
  {
    label: "Pédagogie",
    icon: BookOpen,
    expandable: true,
    children: [
      "Classes",
      "Matières",
      "Emploi du temps",
      "Notes & Bulletins",
    ],
  },
  {
    label: "Enseignants",
    icon: UsersRound,
  },
  {
    label: "RH",
    icon: UserRound,
  },
  {
    label: "Communication",
    icon: Mail,
  },
  {
    label: "Discipline",
    icon: ShieldCheck,
  },
  {
    label: "Examens",
    icon: GraduationCap,
  },
  {
    label: "Santé",
    icon: Activity,
  },
  {
    label: "Archives",
    icon: FileSpreadsheet,
  },
  {
    label: "Paramètres",
    icon: Settings,
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function ClassesPage() {
  /* =======================================================
     DONNÉES
  ======================================================= */

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherUsers, setTeacherUsers] = useState<TeacherUser[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);

  const [userProfile, setUserProfile] =
    useState<UserProfile | null>(null);

  const [schoolId, setSchoolId] = useState("");

  /* =======================================================
     UI
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  
  const [search, setSearch] = useState("");
  const [cycleFilter, setCycleFilter] =
    useState<CycleFilter>("all");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showImportModal, setShowImportModal] =
    useState(false);

  const [showTeamModal, setShowTeamModal] =
    useState(false);

  const [selectedClass, setSelectedClass] =
    useState<SchoolClass | null>(null);

  const [selectedClassForTeam, setSelectedClassForTeam] =
    useState<SchoolClass | null>(null);

  /* =======================================================
     CRÉATION CLASSE
  ======================================================= */

  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState("");
  const [className, setClassName] = useState("");

  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] =
    useState<string | null>(null);

  /* =======================================================
     ÉQUIPE PÉDAGOGIQUE
  ======================================================= */

  const [classSubjects, setClassSubjects] =
    useState<ClassSubject[]>([]);

  const [teacherSubjects, setTeacherSubjects] =
    useState<TeacherSubject[]>([]);

  const [selectedSubject, setSelectedSubject] =
    useState("");

    const [selectedPrincipalTeacher, setSelectedPrincipalTeacher] =
  useState("");

    const [selectedSubjectCoefficient, setSelectedSubjectCoefficient] =
  useState(1);

  const [teamLoading, setTeamLoading] =
    useState(false);

  const [teamSaving, setTeamSaving] =
    useState(false);



  /* =======================================================
     IMPORT EXCEL
  ======================================================= */

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [importRows, setImportRows] =
    useState<ImportRow[]>([]);

  const [importFileName, setImportFileName] =
    useState("");

  const [importLoading, setImportLoading] =
    useState(false);

  const [importProgress, setImportProgress] =
    useState(0);

  /* =======================================================
     MESSAGES
  ======================================================= */

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     RÔLES
  ======================================================= */

  const userRole =
    userProfile?.roles?.name ?? "";

  const isDirector =
    userRole === "Directeur";

  const isTeacher =
    userRole === "Enseignant";

  /* =======================================================
     CHARGEMENT PRINCIPAL
  ======================================================= */

  const loadData = async (
    showRefresh = false
  ) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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
        throw new Error(
          "Utilisateur non connecté."
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("users")
          .select(
            `
              id,
              auth_user_id,
              school_id,
              role_id,
              first_name,
              last_name,
              email,
              roles (
                name
              )
            `
          )
          .eq("auth_user_id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error(
          "Votre profil EduSoft est introuvable."
        );
      }

      const formattedProfile =
        profile as unknown as UserProfile;

      setUserProfile(formattedProfile);

      const currentSchoolId =
        formattedProfile.school_id;

      setSchoolId(currentSchoolId);

      const [
        cyclesResult,
        levelsResult,
        seriesResult,
        academicYearsResult,
        classesResult,
        subjectsResult,
        teachersResult,
        enrollmentsResult,
      ] = await Promise.all([
        supabase
          .from("cycles")
          .select("*")
          .eq("school_id", currentSchoolId)
          .order("created_at"),

        supabase
          .from("levels")
          .select("*")
          .eq("school_id", currentSchoolId)
          .order("display_order"),

        supabase
          .from("series")
          .select("*")
          .eq("school_id", currentSchoolId)
          .order("name"),

        supabase
          .from("academic_years")
          .select("*")
          .eq("school_id", currentSchoolId)
          .order("start_date", {
            ascending: false,
          }),

        supabase
          .from("classes")
          .select("*")
          .eq("school_id", currentSchoolId)
          .order("name"),

        supabase
          .from("subjects")
          .select("*")
          .eq("school_id", currentSchoolId)
          .order("name"),

        supabase
          .from("teachers")
          .select(
            `
              id,
              school_id,
              user_id,
              employee_number
            `
          )
          .eq("school_id", currentSchoolId),

        supabase
          .from("student_enrollments")
          .select(
            `
              id,
              student_id,
              class_id,
              academic_year_id
            `
          ),
      ]);

      if (cyclesResult.error)
        throw cyclesResult.error;

      if (levelsResult.error)
        throw levelsResult.error;

      if (seriesResult.error)
        throw seriesResult.error;

      if (academicYearsResult.error)
        throw academicYearsResult.error;

      if (classesResult.error)
        throw classesResult.error;

      if (subjectsResult.error)
        throw subjectsResult.error;

      if (teachersResult.error)
        throw teachersResult.error;

      if (enrollmentsResult.error)
        throw enrollmentsResult.error;

      const loadedClasses =
        (classesResult.data || []) as SchoolClass[];

      const loadedYears =
        (academicYearsResult.data || []) as AcademicYear[];

      const activeYear = loadedYears.find(
        (year) => year.is_active
      );

      setCycles(cyclesResult.data || []);
      setLevels(levelsResult.data || []);
      setSeries(seriesResult.data || []);
      setAcademicYears(loadedYears);
      setClasses(loadedClasses);
      setSubjects(subjectsResult.data || []);
      setTeachers(teachersResult.data || []);

      const loadedEnrollments =
        (enrollmentsResult.data ||
          []) as StudentEnrollment[];

      /*
       * On ne conserve que les inscriptions
       * de l'école via les classes appartenant
       * à l'école.
       */
      const schoolClassIds = new Set(
        loadedClasses.map((item) => item.id)
      );

      setEnrollments(
        loadedEnrollments.filter((item) =>
          schoolClassIds.has(item.class_id)
        )
      );

      if (activeYear) {
        setSelectedAcademicYear(
          activeYear.id
        );
      }

      /*
       * Chargement des utilisateurs des enseignants.
       */
      const teacherUserIds = (
        teachersResult.data || []
      )
        .map(
          (teacher) => teacher.user_id
        )
        .filter(
          (id): id is string =>
            Boolean(id)
        );

      if (teacherUserIds.length > 0) {
        const {
          data: usersData,
          error: usersError,
        } = await supabase
          .from("users")
          .select(
            `
              id,
              first_name,
              last_name,
              email
            `
          )
          .in(
            "id",
            teacherUserIds
          );

        if (usersError) {
          throw usersError;
        }

        setTeacherUsers(
          (usersData || []) as TeacherUser[]
        );
      } else {
        setTeacherUsers([]);
      }
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT CLASSES :",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les données."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     HELPERS
  ======================================================= */

  const getCycleName = (
    cycleId: string
  ) => {
    return (
      cycles.find(
        (cycle) =>
          cycle.id === cycleId
      )?.name || "Cycle inconnu"
    );
  };

  const getLevelName = (
    levelId: string | null
  ) => {
    if (!levelId) return "";

    return (
      levels.find(
        (level) =>
          level.id === levelId
      )?.name || ""
    );
  };

  const getSeriesName = (
    seriesId: string | null
  ) => {
    if (!seriesId) return "";

    return (
      series.find(
        (item) =>
          item.id === seriesId
      )?.name || ""
    );
  };

  const getTeacherName = (
    teacherId: string | null
  ) => {

    if (!teacherId) {
      return "Aucun enseignant";
    }

    const teacher =
      teachers.find(
        (item) =>
          item.id === teacherId
      );

    if (!teacher) {
      return "Aucun enseignant";
    }

    const user =
      teacherUsers.find(
        (item) =>
          item.id === teacher.user_id
      );

    if (!user) {
      return (
        teacher.employee_number ||
        "Enseignant"
      );
    }

    const fullName =
      `${user.first_name || ""} ${
        user.last_name || ""
      }`.trim();

    return (
      fullName ||
      user.email ||
      teacher.employee_number ||
      "Enseignant"
    );
  };

  const getStudentCount = (
    classId: string
  ) => {
    return enrollments.filter(
      (item) =>
        item.class_id === classId
    ).length;
  };

  /* =======================================================
     CLASSES ENRICHIES
  ======================================================= */

  const classViews = useMemo<ClassView[]>(
    () => {
      return classes.map(
        (schoolClass) => ({
          ...schoolClass,
          cycleName:
            getCycleName(
              schoolClass.cycle_id
            ),
          levelName:
            getLevelName(
              schoolClass.level_id
            ),
          seriesName:
            getSeriesName(
              schoolClass.series_id
            ),
          studentCount:
            getStudentCount(
              schoolClass.id
            ),
          principalTeacherName:
            getTeacherName(
              schoolClass.principal_teacher_id
            ),
        })
      );
    },
    [
      classes,
      cycles,
      levels,
      series,
      enrollments,
      teachers,
      teacherUsers,
    ]
  );

  /* =======================================================
     FILTRE
  ======================================================= */

  const filteredClasses =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      return classViews.filter(
        (schoolClass) => {
          const matchesSearch =
            !value ||
            schoolClass.name
              .toLowerCase()
              .includes(value) ||
            schoolClass.levelName
              .toLowerCase()
              .includes(value) ||
            schoolClass.cycleName
              .toLowerCase()
              .includes(value);

          let matchesCycle = true;

          if (cycleFilter !== "all") {
            matchesCycle =
              schoolClass.cycleName
                .toLowerCase()
                .trim() === cycleFilter.toLowerCase();
          }

          return (
            matchesSearch &&
            matchesCycle
          );
        }
      );
    }, [
      classViews,
      search,
      cycleFilter,
    ]);

  /* =======================================================
     ANNÉE ACTIVE
  ======================================================= */

  const activeAcademicYear =
    academicYears.find(
      (year) => year.is_active
    );

  /* =======================================================
     STATISTIQUES
  ======================================================= */

  const approvedClasses =
    classViews.filter(
      (item) =>
        item.status === "approved"
    );

  const totalClasses =
    approvedClasses.length;

  const totalStudents =
    approvedClasses.reduce(
      (total, item) =>
        total + item.studentCount,
      0
    );

  /*
   * Ces deux indicateurs sont calculés
   * depuis les données disponibles.
   *
   * Si les tables grades/attendance sont
   * ajoutées au chargement, ils pourront
   * devenir entièrement dynamiques.
   */
  const successRate = 0;

  const attendanceRate = 0;

  /* =======================================================
     RÉPARTITION CYCLES
  ======================================================= */

  const primaryCount =
    approvedClasses.filter(
      (item) =>
        item.cycleName ===
        "Primaire"
    ).length;

  const collegeCount =
    approvedClasses.filter(
      (item) =>
        item.cycleName ===
        "Collège"
    ).length;

  const generalHighSchoolCount =
    approvedClasses.filter(
      (item) =>
        item.cycleName
          .toLowerCase()
          .trim() === "lycée général"
    ).length;

  const technicalHighSchoolCount =
    approvedClasses.filter(
      (item) =>
        item.cycleName
          .toLowerCase()
          .trim() === "lycée technique"
    ).length;

  const highSchoolCount =
    generalHighSchoolCount +
    technicalHighSchoolCount;

  const cycleTotal =
    primaryCount +
    collegeCount +
    highSchoolCount;

  const primaryPercent =
    cycleTotal > 0
      ? Math.round(
          (primaryCount /
            cycleTotal) *
            100
        )
      : 0;

  const collegePercent =
    cycleTotal > 0
      ? Math.round(
          (collegeCount /
            cycleTotal) *
            100
        )
      : 0;

  const highSchoolPercent =
    cycleTotal > 0
      ? Math.round(
          (highSchoolCount /
            cycleTotal) *
            100
        )
      : 0;

  /* =======================================================
     CLASSES EN ATTENTE
  ======================================================= */

  const pendingClasses =
    classViews.filter(
      (item) =>
        item.status === "pending"
    );

  /* =======================================================
     MODAL CRÉATION
  ======================================================= */

  const selectedCycleData =
    cycles.find(
      (cycle) =>
        cycle.id === selectedCycle
    );

  const availableLevels =
    levels
      .filter(
        (level) =>
          level.cycle_id ===
          selectedCycle
      )
      .sort(
        (a, b) =>
          a.display_order -
          b.display_order
      );

  const availableSeries =
    series.filter(
      (item) =>
        item.cycle_id ===
        selectedCycle
    );

  /*
   * Le Lycée général et le Lycée technique sont
   * deux contextes pédagogiques distincts.
   */
  const isHighSchool =
    selectedCycleData?.name ===
      "Lycée général" ||
    selectedCycleData?.name ===
      "Lycée technique";

  const resetCreateModal =
    () => {
      setSelectedCycle("");
      setSelectedLevel("");
      setSelectedSeries("");
      setClassName("");

      const activeYear =
        academicYears.find(
          (year) =>
            year.is_active
        );

      setSelectedAcademicYear(
        activeYear?.id || ""
      );

      setErrorMessage("");
    };

  const closeCreateModal =
    () => {
      if (saving) return;

      setShowCreateModal(false);
      resetCreateModal();
    };

  const handleCycleChange =
    (cycleId: string) => {
      setSelectedCycle(cycleId);
      setSelectedLevel("");
      setSelectedSeries("");
    };

  /* =======================================================
     CRÉATION CLASSE
  ======================================================= */

  const handleCreateClass =
    async () => {
      setErrorMessage("");
      setSuccessMessage("");

      if (!schoolId) {
        setErrorMessage(
          "École introuvable."
        );
        return;
      }

      if (
        !isDirector &&
        !isTeacher
      ) {
        setErrorMessage(
          "Votre rôle ne vous autorise pas à créer une classe."
        );
        return;
      }

      if (!selectedCycle) {
        setErrorMessage(
          "Veuillez sélectionner un cycle."
        );
        return;
      }

      if (!selectedLevel) {
        setErrorMessage(
          "Veuillez sélectionner un niveau."
        );
        return;
      }

      if (!selectedAcademicYear) {
        setErrorMessage(
          "Veuillez sélectionner une année scolaire."
        );
        return;
      }

      if (!className.trim()) {
        setErrorMessage(
          "Veuillez saisir le nom de la classe."
        );
        return;
      }

      if (
        isHighSchool &&
        !selectedSeries
      ) {
        setErrorMessage(
          "Veuillez sélectionner une série."
        );
        return;
      }

      setSaving(true);

      try {
        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            "Utilisateur non connecté."
          );
        }

        const normalizedName =
          className.trim();

        const {
          data: existingClass,
          error: existingError,
        } =
          await supabase
            .from("classes")
            .select("id")
            .eq(
              "school_id",
              schoolId
            )
            .eq(
              "academic_year_id",
              selectedAcademicYear
            )
            .eq(
              "cycle_id",
              selectedCycle
            )
            .ilike(
              "name",
              normalizedName
            )
            .maybeSingle();

        if (existingError) {
          throw existingError;
        }

        if (existingClass) {
          setErrorMessage(
            "Une classe portant ce nom existe déjà pour cette année scolaire."
          );
          return;
        }

        const status =
          isDirector
            ? "approved"
            : "pending";

        const {
          data,
          error,
        } = await supabase
          .from("classes")
          .insert({
            school_id:
              schoolId,
            cycle_id:
              selectedCycle,
            level_id:
              selectedLevel,
            series_id:
              isHighSchool
                ? selectedSeries
                : null,
            academic_year_id:
              selectedAcademicYear,
            name:
              normalizedName,
            status,
            created_by:
              user.id,
          })
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setClasses(
            (previous) => [
              ...previous,
              data as SchoolClass,
            ]
          );
        }

        setShowCreateModal(false);
        resetCreateModal();

        setSuccessMessage(
          isDirector
            ? "La classe a été créée et validée."
            : "La classe a été créée et envoyée au directeur pour validation."
        );
      } catch (error) {
        console.error(
          "ERREUR CRÉATION CLASSE :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de créer la classe."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const handleValidate =
    async (
      classId: string
    ) => {
      if (!isDirector) return;

      setProcessingId(classId);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError)
          throw authError;

        if (!user)
          throw new Error(
            "Utilisateur non connecté."
          );

        const {
          data,
          error,
        } =
          await supabase
            .from("classes")
            .update({
              status:
                "approved",
              validated_by:
                user.id,
              validated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              classId
            )
            .eq(
              "school_id",
              schoolId
            )
            .eq(
              "status",
              "pending"
            )
            .select("*")
            .single();

        if (error)
          throw error;

        setClasses(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                classId
                  ? (data as SchoolClass)
                  : item
            )
        );

        setSuccessMessage(
          "La classe a été validée avec succès."
        );
      } catch (error) {
        console.error(
          "ERREUR VALIDATION :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de valider la classe."
        );
      } finally {
        setProcessingId(null);
      }
    };

  /* =======================================================
     REFUS
  ======================================================= */

  const handleReject =
    async (
      classId: string
    ) => {
      if (!isDirector) return;

      const confirmed =
        window.confirm(
          "Voulez-vous vraiment refuser cette demande ?"
        );

      if (!confirmed)
        return;

      setProcessingId(classId);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError)
          throw authError;

        if (!user)
          throw new Error(
            "Utilisateur non connecté."
          );

        const {
          data,
          error,
        } =
          await supabase
            .from("classes")
            .update({
              status:
                "rejected",
              validated_by:
                user.id,
              validated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              classId
            )
            .eq(
              "school_id",
              schoolId
            )
            .eq(
              "status",
              "pending"
            )
            .select("*")
            .single();

        if (error)
          throw error;

        setClasses(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                classId
                  ? (data as SchoolClass)
                  : item
            )
        );

        setSuccessMessage(
          "La demande a été refusée."
        );
      } catch (error) {
        console.error(
          "ERREUR REFUS :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de refuser la classe."
        );
      } finally {
        setProcessingId(null);
      }
    };

  /* =======================================================
     SUPPRESSION
  ======================================================= */

  const handleDelete =
    async (
      schoolClass: SchoolClass
    ) => {
      if (!isDirector) {
        setErrorMessage(
          "Seul le directeur peut supprimer une classe."
        );
        return;
      }

      if (
        schoolClass.status !==
        "approved"
      ) {
        setErrorMessage(
          "Seules les classes validées peuvent être supprimées."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Êtes-vous sûr de vouloir supprimer la classe "${schoolClass.name}" ?`
        );

      if (!confirmed)
        return;

      setProcessingId(
        schoolClass.id
      );
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const {
          error,
        } = await supabase
          .from("classes")
          .delete()
          .eq(
            "id",
            schoolClass.id
          )
          .eq(
            "school_id",
            schoolId
          );

        if (error)
          throw error;

        setClasses(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                schoolClass.id
            )
        );

        setEnrollments(
          (previous) =>
            previous.filter(
              (item) =>
                item.class_id !==
                schoolClass.id
            )
        );

        setSuccessMessage(
          `La classe "${schoolClass.name}" a été supprimée.`
        );
      } catch (error) {
        console.error(
          "ERREUR SUPPRESSION :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de supprimer la classe."
        );
      } finally {
        setProcessingId(null);
      }
    };

  /* =======================================================
     ÉQUIPE PÉDAGOGIQUE
  ======================================================= */

  const loadClassTeam =
    async (
      schoolClass: SchoolClass
    ) => {
      setSelectedClassForTeam(
        schoolClass
      );

      setSelectedPrincipalTeacher(
  schoolClass.principal_teacher_id || ""
);

      setShowTeamModal(true);
      setTeamLoading(true);

      setClassSubjects([]);
      setTeacherSubjects([]);
      setSelectedSubject("");
      setErrorMessage("");

      try {
        const [
          classSubjectsResult,
          teacherSubjectsResult,
        ] = await Promise.all([
          supabase
            .from("class_subjects")
            .select("*")
            .eq(
              "class_id",
              schoolClass.id
            )
            .eq(
              "academic_year_id",
              schoolClass.academic_year_id
            ),

          supabase
            .from("teacher_subjects")
            .select("*")
            .eq(
              "class_id",
              schoolClass.id
            )
            .eq(
              "academic_year_id",
              schoolClass.academic_year_id
            ),
        ]);

        if (
          classSubjectsResult.error
        ) {
          throw classSubjectsResult.error;
        }

        if (
          teacherSubjectsResult.error
        ) {
          throw teacherSubjectsResult.error;
        }

        setClassSubjects(
          (classSubjectsResult.data ||
            []) as ClassSubject[]
        );

        setTeacherSubjects(
          (teacherSubjectsResult.data ||
            []) as TeacherSubject[]
        );
      } catch (error) {
        console.error(
          "ERREUR ÉQUIPE :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger l'équipe pédagogique."
        );
      } finally {
        setTeamLoading(false);
      }
    };

  const closeTeamModal =
    () => {
      if (teamSaving) return;

      setShowTeamModal(false);
      setSelectedClassForTeam(
        null
      );
      setClassSubjects([]);
      setTeacherSubjects([]);
      setSelectedSubject("");
      setErrorMessage("");
    };

  const handleAddSubject =
    async () => {
      if (
        !selectedClassForTeam ||
        !selectedSubject
      ) {
        return;
      }

      setTeamSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const exists =
          classSubjects.some(
            (item) =>
              item.subject_id ===
              selectedSubject
          );

        if (exists) {
          setErrorMessage(
            "Cette matière est déjà affectée à cette classe."
          );
          return;
        }

       console.log("MATIÈRE SÉLECTIONNÉE :", selectedSubject);
console.log(
  "COEFFICIENT SÉLECTIONNÉ :",
  selectedSubjectCoefficient
);

const {
  data,
  error,
} = await supabase
  .from("class_subjects")
  .insert({
    class_id: selectedClassForTeam.id,
    subject_id: selectedSubject,
    academic_year_id:
      selectedClassForTeam.academic_year_id,
    coefficient: selectedSubjectCoefficient,
  })
  .select("*")
  .single();

        if (error)
          throw error;
       
        console.log("LIGNE RETOURNÉE PAR SUPABASE :", data);
console.log(
  "COEFFICIENT RETOURNÉ PAR SUPABASE :",
  data?.coefficient
);

        setClassSubjects(
          (previous) => [
            ...previous,
            data as ClassSubject,
          ]
        );

        setSelectedSubject("");

        setSelectedSubjectCoefficient(1);

        setSuccessMessage(
          "La matière a été ajoutée."
        );
      } catch (error) {
        console.error(
          "ERREUR AJOUT MATIÈRE :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter la matière."
        );
      } finally {
        setTeamSaving(false);
      }
    };

  const handleTeacherChange =
    async (
      classSubject: ClassSubject,
      teacherId: string
    ) => {
      if (
        !selectedClassForTeam ||
        !teacherId
      ) {
        return;
      }

      setTeamSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const existing =
          teacherSubjects.find(
            (item) =>
              item.subject_id ===
                classSubject.subject_id &&
              item.class_id ===
                selectedClassForTeam.id &&
              item.academic_year_id ===
                selectedClassForTeam.academic_year_id
          );

        if (existing) {
          
          console.log(
  "COEFFICIENT ENVOYÉ :",
  selectedSubjectCoefficient
);
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "teacher_subjects"
              )
              .update({
                teacher_id:
                  teacherId,
              })
              .eq(
                "id",
                existing.id
              )
              .select("*")
              .single();

          if (error)
            throw error;

          setTeacherSubjects(
            (previous) =>
              previous.map(
                (item) =>
                  item.id ===
                  existing.id
                    ? (data as TeacherSubject)
                    : item
              )
          );
        } else {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "teacher_subjects"
              )
              .insert({
                teacher_id:
                  teacherId,
                subject_id:
                  classSubject.subject_id,
                class_id:
                  selectedClassForTeam.id,
                academic_year_id:
                  selectedClassForTeam.academic_year_id,
              })
              .select("*")
              .single();

          if (error)
            throw error;

          setTeacherSubjects(
            (previous) => [
              ...previous,
              data as TeacherSubject,
            ]
          );
        }

        setSuccessMessage(
          "L'enseignant a été affecté."
        );
      } catch (error) {
        console.error(
          "ERREUR AFFECTATION :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible d'affecter l'enseignant."
        );
      } finally {
        setTeamSaving(false);
      }
    };

const handlePrincipalTeacherChange = async (
  teacherId: string
) => {
  console.log(
    "HANDLE PRINCIPAL APPELÉ :",
    teacherId
  );

  if (!selectedClassForTeam) {
    return;
  }

  setTeamSaving(true);
  setErrorMessage("");
  setSuccessMessage("");

  try {
    /*
     * =====================================================
     * 1. ENREGISTRER L'ENSEIGNANT PRINCIPAL DE LA CLASSE
     * =====================================================
     */

    const { error: classError } =
      await supabase
        .from("classes")
        .update({
          principal_teacher_id:
            teacherId || null,
        })
        .eq(
          "id",
          selectedClassForTeam.id
        );

    if (classError) {
      throw classError;
    }

    /*
     * =====================================================
     * 2. MISE À JOUR DE L'ÉTAT LOCAL
     * =====================================================
     */

    setSelectedPrincipalTeacher(
      teacherId
    );

    setClasses((previous) =>
      previous.map((schoolClass) =>
        schoolClass.id ===
        selectedClassForTeam.id
          ? {
              ...schoolClass,
              principal_teacher_id:
                teacherId || null,
            }
          : schoolClass
      )
    );

    setSelectedClassForTeam(
      (previous) =>
        previous
          ? {
              ...previous,
              principal_teacher_id:
                teacherId || null,
            }
          : null
    );

    /*
     * =====================================================
     * 3. VÉRIFIER SI LA CLASSE EST AU PRIMAIRE
     * =====================================================
     */

    const selectedCycle =
      cycles.find(
        (cycle) =>
          cycle.id ===
          selectedClassForTeam.cycle_id
      );

    const isPrimary =
      selectedCycle?.name
        ?.toLowerCase()
        .includes("primaire");

    /*
     * =====================================================
     * 4. PRIMAIRE :
     *    L'ENSEIGNANT PRINCIPAL COUVRE AUTOMATIQUEMENT
     *    TOUTES LES MATIÈRES DE LA CLASSE
     * =====================================================
     */

    if (
      isPrimary &&
      teacherId &&
      classSubjects.length > 0
    ) {
      const updatedTeacherSubjects: TeacherSubject[] =
        [];

      for (const classSubject of classSubjects) {
        const existing =
          teacherSubjects.find(
            (item) =>
              item.subject_id ===
                classSubject.subject_id &&
              item.class_id ===
                selectedClassForTeam.id &&
              item.academic_year_id ===
                selectedClassForTeam.academic_year_id
          );

        /*
         * Si une affectation existe déjà,
         * on change simplement l'enseignant.
         */

        if (existing) {
          const {
            data,
            error,
          } = await supabase
            .from("teacher_subjects")
            .update({
              teacher_id:
                teacherId,
            })
            .eq(
              "id",
              existing.id
            )
            .select("*")
            .single();

          if (error) {
            throw error;
          }

          updatedTeacherSubjects.push(
            data as TeacherSubject
          );
        }

        /*
         * Sinon, on crée automatiquement
         * l'affectation enseignant/matière.
         */

        else {
          const {
            data,
            error,
          } = await supabase
            .from("teacher_subjects")
            .insert({
              teacher_id:
                teacherId,
              subject_id:
                classSubject.subject_id,
              class_id:
                selectedClassForTeam.id,
              academic_year_id:
                selectedClassForTeam.academic_year_id,
            })
            .select("*")
            .single();

          if (error) {
            throw error;
          }

          updatedTeacherSubjects.push(
            data as TeacherSubject
          );
        }
      }

      /*
       * Mise à jour de l'interface avec
       * les nouvelles affectations.
       */

      setTeacherSubjects(
        (previous) => {
          const otherAssignments =
            previous.filter(
              (item) =>
                !classSubjects.some(
                  (classSubject) =>
                    classSubject.subject_id ===
                      item.subject_id &&
                    item.class_id ===
                      selectedClassForTeam.id &&
                    item.academic_year_id ===
                      selectedClassForTeam.academic_year_id
                )
            );

          return [
            ...otherAssignments,
            ...updatedTeacherSubjects,
          ];
        }
      );

      console.log(
        "ENSEIGNANT PRINCIPAL AFFECTÉ AUTOMATIQUEMENT AUX MATIÈRES :",
        updatedTeacherSubjects
      );
    }

    /*
     * =====================================================
     * 5. MESSAGE DE SUCCÈS
     * =====================================================
     */

    if (isPrimary && teacherId) {
      setSuccessMessage(
        "L’enseignant principal a été enregistré et affecté automatiquement à toutes les matières de la classe."
      );
    } else {
      setSuccessMessage(
        "L’enseignant principal a été enregistré."
      );
    }
  } catch (error) {
    console.error(
      "ERREUR ENSEIGNANT PRINCIPAL :",
      error
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible d'enregistrer l'enseignant principal."
    );
  } finally {
    setTeamSaving(false);
  }
};
  /* =======================================================
     IMPORT EXCEL
  ======================================================= */

  const handleExcelFile =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      setErrorMessage("");
      setSuccessMessage("");
      setImportLoading(true);
      setImportRows([]);
      setImportFileName(
        file.name
      );

      try {
        /*
         * xlsx est chargé dynamiquement
         * afin de ne pas alourdir le bundle
         * initial de la page.
         */
        const XLSX =
          await import("xlsx");

        const buffer =
          await file.arrayBuffer();

        const workbook =
          XLSX.read(buffer, {
            type: "array",
          });

        const firstSheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        if (!firstSheet) {
          throw new Error(
            "Le fichier Excel ne contient aucune feuille."
          );
        }

        const rows =
          XLSX.utils.sheet_to_json<
            Record<string, unknown>
          >(firstSheet, {
            defval: "",
          });

        if (rows.length === 0) {
          throw new Error(
            "Le fichier Excel est vide."
          );
        }

        const normalizeKey =
          (value: string) =>
            value
              .toLowerCase()
              .trim()
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                ""
              )
              .replace(
                /[\s_-]/g,
                ""
              );

        const findValue =
          (
            row: Record<
              string,
              unknown
            >,
            aliases: string[]
          ) => {
            const key =
              Object.keys(row).find(
                (item) =>
                  aliases.includes(
                    normalizeKey(item)
                  )
              );

            return key
              ? String(
                  row[key] ?? ""
                ).trim()
              : "";
          };

        const parsedRows: ImportRow[] =
          rows
            .map((row) => ({
              name: findValue(
                row,
                [
                  "nom",
                  "nomclasse",
                  "classe",
                  "name",
                ]
              ),
              cycle: findValue(
                row,
                [
                  "cycle",
                  "cycles",
                ]
              ),
              level: findValue(
                row,
                [
                  "niveau",
                  "level",
                ]
              ),
              series:
                findValue(
                  row,
                  [
                    "serie",
                    "series",
                  ]
                ) ||
                undefined,
            }))
            .filter(
              (row) =>
                row.name &&
                row.cycle &&
                row.level
            );

        if (
          parsedRows.length === 0
        ) {
          throw new Error(
            "Aucune ligne valide trouvée. Les colonnes attendues sont : Classe, Cycle, Niveau et éventuellement Série."
          );
        }

        setImportRows(
          parsedRows
        );
      } catch (error) {
        console.error(
          "ERREUR IMPORT EXCEL :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de lire le fichier Excel."
        );
      } finally {
        setImportLoading(false);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }
      }
    };

  const handleImportClasses =
    async () => {
      if (
        importRows.length === 0
      ) {
        setErrorMessage(
          "Aucune classe à importer."
        );
        return;
      }

      if (!schoolId) {
        setErrorMessage(
          "École introuvable."
        );
        return;
      }

      if (
        !selectedAcademicYear
      ) {
        setErrorMessage(
          "Veuillez sélectionner une année scolaire active."
        );
        return;
      }

      setImportLoading(true);
      setImportProgress(0);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError)
          throw authError;

        if (!user)
          throw new Error(
            "Utilisateur non connecté."
          );

        let imported = 0;
        let skipped = 0;

        for (
          let index = 0;
          index <
          importRows.length;
          index++
        ) {
          const row =
            importRows[index];

          const cycle =
            cycles.find(
              (item) =>
                item.name
                  .toLowerCase()
                  .trim() ===
                row.cycle
                  .toLowerCase()
                  .trim()
            );

          if (!cycle) {
            skipped++;
            setImportProgress(
              Math.round(
                ((index + 1) /
                  importRows.length) *
                  100
              )
            );
            continue;
          }

          const level =
            levels.find(
              (item) =>
                item.cycle_id ===
                  cycle.id &&
                item.name
                  .toLowerCase()
                  .trim() ===
                  row.level
                    .toLowerCase()
                    .trim()
            );

          if (!level) {
            skipped++;
            setImportProgress(
              Math.round(
                ((index + 1) /
                  importRows.length) *
                  100
              )
            );
            continue;
          }

          let seriesId:
            | string
            | null =
            null;

          if (
            row.series
          ) {
            const foundSeries =
              series.find(
                (item) =>
                  item.cycle_id ===
                    cycle.id &&
                  item.name
                    .toLowerCase()
                    .trim() ===
                    row.series!
                      .toLowerCase()
                      .trim()
              );

            if (
              foundSeries
            ) {
              seriesId =
                foundSeries.id;
            }
          }

          const {
            data: existing,
            error: existingError,
          } =
            await supabase
              .from("classes")
              .select("id")
              .eq(
                "school_id",
                schoolId
              )
              .eq(
                "academic_year_id",
                selectedAcademicYear
              )
              .eq(
                "cycle_id",
                cycle.id
              )
              .ilike(
                "name",
                row.name
              )
              .maybeSingle();

          if (existingError)
            throw existingError;

          if (existing) {
            skipped++;
          } else {
            const {
              error,
            } =
              await supabase
                .from(
                  "classes"
                )
                .insert({
                  school_id:
                    schoolId,
                  cycle_id:
                    cycle.id,
                  level_id:
                    level.id,
                  series_id:
                    seriesId,
                  academic_year_id:
                    selectedAcademicYear,
                  name:
                    row.name,
                  status:
                    isDirector
                      ? "approved"
                      : "pending",
                  created_by:
                    user.id,
                });

            if (error)
              throw error;

            imported++;
          }

          setImportProgress(
            Math.round(
              ((index + 1) /
                importRows.length) *
                100
            )
          );
        }

        await loadData(true);

        setImportRows([]);
        setImportFileName("");

        setSuccessMessage(
          `${imported} classe(s) importée(s). ${skipped} ligne(s) ignorée(s).`
        );
      } catch (error) {
        console.error(
          "ERREUR IMPORT CLASSES :",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible d'importer les classes."
        );
      } finally {
        setImportLoading(false);
      }
    };

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const handleExport =
    () => {
      const rows =
        filteredClasses.map(
          (item) => ({
            Classe:
              item.name,
            Cycle:
              item.cycleName,
            Niveau:
              item.levelName,
            Série:
              item.seriesName,
            Effectif:
              item.studentCount,
            "Enseignant principal":
              item.principalTeacherName,
            Statut:
              item.status ===
              "approved"
                ? "Validée"
                : item.status ===
                  "pending"
                ? "En attente"
                : "Refusée",
            "Année scolaire":
              academicYears.find(
                (year) =>
                  year.id ===
                  item.academic_year_id
              )?.name ||
              "",
          })
        );

      const headers =
        Object.keys(
          rows[0] || {
            Classe: "",
            Cycle: "",
            Niveau: "",
            Série: "",
            Effectif: "",
            "Enseignant principal":
              "",
            Statut: "",
            "Année scolaire":
              "",
          }
        );

      const escapeCsv =
        (value: unknown) => {
          const text =
            String(
              value ?? ""
            );

          return `"${text.replace(
            /"/g,
            '""'
          )}"`;
        };

      const csv = [
        headers
          .map(escapeCsv)
          .join(";"),
        ...rows.map(
          (row) =>
            headers
              .map(
                (header) =>
                  escapeCsv(
                    row[
                      header as keyof typeof row
                    ]
                  )
              )
              .join(";")
        ),
      ].join("\n");

      const blob =
        new Blob(
          ["\uFEFF" + csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `edusoft-classes-${
          activeAcademicYear?.name ||
          "export"
        }.csv`;

      link.click();

      URL.revokeObjectURL(
        url
      );
    };

  /* =======================================================
     RAPPORT
  ======================================================= */

  const handleCycleReport =
    () => {
      const report = [
        `RAPPORT EDUSOFT CG`,
        `Année scolaire : ${
          activeAcademicYear?.name ||
          "Non définie"
        }`,
        "",
        `Total classes : ${totalClasses}`,
        `Total élèves : ${totalStudents}`,
        "",
        `Primaire : ${primaryCount} classes`,
        `Collège : ${collegeCount} classes`,
        `Lycée général : ${generalHighSchoolCount} classes`,
        `Lycée technique : ${technicalHighSchoolCount} classes`,
      ].join("\n");

      const blob =
        new Blob(
          [report],
          {
            type:
              "text/plain;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `rapport-cycles-${
          activeAcademicYear?.name ||
          "edusoft"
        }.txt`;

      link.click();

      URL.revokeObjectURL(
        url
      );
    };

  /* =======================================================
     RENDU
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-gray-900">
{/* ===================================================
          SIDEBAR MOBILE
      =================================================== */}

      

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <div className="pl-[270px] min-w-0">
      {/* ===================================================
          CONTENU
      =================================================== */}
        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[78px] items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-3">
              

              <div>
                <div className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">
                  <span>
                    Pédagogie
                  </span>

                  <ChevronRight className="h-3 w-3" />

                  <span className="font-medium text-gray-600">
                    Classes
                  </span>
                </div>

                <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">
                  Classes
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ANNÉE */}

              <select
                value={
                  selectedAcademicYear
                }
                onChange={(event) =>
                  setSelectedAcademicYear(
                    event.target.value
                  )
                }
                className="hidden rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-[#6366F1] sm:block"
              >
                {academicYears.map(
                  (year) => (
                    <option
                      key={
                        year.id
                      }
                      value={
                        year.id
                      }
                    >
                      {year.name}
                      {year.is_active
                        ? " — Active"
                        : ""}
                    </option>
                  )
                )}
              </select>

              {/* NOTIFICATIONS */}

              <button
                type="button"
                className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 sm:flex"
              >
                <Bell className="h-[18px] w-[18px]" />

                {pendingClasses.length >
                  0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F59E0B]" />
                )}
              </button>

              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 sm:flex"
              >
                <Mail className="h-[18px] w-[18px]" />
              </button>

              {/* PROFIL */}

              <div className="hidden items-center gap-2 pl-2 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <UserRound className="h-4 w-4" />
                </div>

                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-gray-800">
                    {[
                      userProfile?.first_name,
                      userProfile?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                      "Admin Directeur"}
                  </p>

                  <p className="text-[10px] text-gray-400">
                    {userRole ||
                      "Directeur"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          {/* =================================================
              TOP
          ================================================= */}

          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-[#6366F1]">
                Gestion pédagogique
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                Organisation des classes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Gérez les classes, effectifs,
                enseignants et cycles de votre établissement.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  loadData(true)
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Actualiser
              </button>

              {(isDirector ||
                isTeacher) && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(
                      true
                    )
                  }
                  className="flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle classe
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              MESSAGES
          ================================================= */}

          {successMessage && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Check className="h-4 w-4 shrink-0" />
              <span>
                {successMessage}
              </span>

              <button
  type="button"
  className="ml-auto"
  onClick={() =>
    setSuccessMessage("")
  }
>
  <X className="h-4 w-4" />
</button>
            </div>
          )}

          {errorMessage &&
            !showCreateModal &&
            !showImportModal &&
            !showTeamModal && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />

                <span>
                  {errorMessage}
                </span>

                <button
  type="button"
  className="ml-auto"
  onClick={() =>
    setErrorMessage("")
  }
>
  <X className="h-4 w-4" />
</button>
              </div>
            )}

          {/* =================================================
              STATISTIQUES
          ================================================= */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total classes"
              value={
                loading
                  ? "—"
                  : totalClasses.toLocaleString(
                      "fr-FR"
                    )
              }
              subtitle="Classes validées"
              icon={
                <BookOpen className="h-5 w-5" />
              }
              iconClass="bg-indigo-50 text-[#6366F1]"
            />

            <StatCard
              title="Total élèves"
              value={
                loading
                  ? "—"
                  : totalStudents.toLocaleString(
                      "fr-FR"
                    )
              }
              subtitle="Élèves inscrits"
              icon={
                <UsersRound className="h-5 w-5" />
              }
              iconClass="bg-blue-50 text-[#3B82F6]"
            />

            <StatCard
              title="Taux de réussite"
              value={
                successRate > 0
                  ? `${successRate}%`
                  : "—"
              }
              subtitle="Données académiques"
              icon={
                <BarChart3 className="h-5 w-5" />
              }
              iconClass="bg-emerald-50 text-[#10B981]"
            />

            <StatCard
              title="Taux de présence"
              value={
                attendanceRate >
                0
                  ? `${attendanceRate}%`
                  : "—"
              }
              subtitle="Présence des élèves"
              icon={
                <Activity className="h-5 w-5" />
              }
              iconClass="bg-orange-50 text-[#F59E0B]"
            />
          </section>

          {/* =================================================
              LAYOUT PRINCIPAL
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* =================================================
                COLONNE PRINCIPALE
            ================================================= */}

            <section className="min-w-0">
              {/* RECHERCHE */}

              <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      type="text"
                      value={
                        search
                      }
                      onChange={(
                        event
                      ) =>
                        setSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Rechercher une classe..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "all",
                        "Primaire",
                        "Collège",
                        "Lycée général",
                        "Lycée technique",
                      ] as CycleFilter[]
                    ).map(
                      (filter) => (
                        <button
                          key={
                            filter
                          }
                          type="button"
                          onClick={() =>
                            setCycleFilter(
                              filter
                            )
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            cycleFilter ===
                            filter
                              ? "bg-[#6366F1] text-white"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {filter ===
                          "all"
                            ? "Tous"
                            : filter}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* SECTIONS CYCLES */}

              {loading ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />

                  <p className="mt-3 text-sm text-gray-500">
                    Chargement des classes...
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <CycleTable
                    title="Primaire"
                    classes={filteredClasses.filter(
                      (item) =>
                        item.cycleName ===
                        "Primaire"
                    )}
                    total={
                      primaryCount
                    }
                    color="blue"
                    isDirector={
                      isDirector
                    }
                    processingId={
                      processingId
                    }
                    onTeam={
                      loadClassTeam
                    }
                    onValidate={
                      handleValidate
                    }
                    onReject={
                      handleReject
                    }
                    onDelete={
                      handleDelete
                    }
                  />

                  <CycleTable
                    title="Collège"
                    classes={filteredClasses.filter(
                      (item) =>
                        item.cycleName ===
                        "Collège"
                    )}
                    total={
                      collegeCount
                    }
                    color="indigo"
                    isDirector={
                      isDirector
                    }
                    processingId={
                      processingId
                    }
                    onTeam={
                      loadClassTeam
                    }
                    onValidate={
                      handleValidate
                    }
                    onReject={
                      handleReject
                    }
                    onDelete={
                      handleDelete
                    }
                  />

                  <CycleTable
                    title="Lycée général"
                    classes={filteredClasses.filter(
                      (item) =>
                        item.cycleName
                          .toLowerCase()
                          .trim() ===
                        "lycée général"
                    )}
                    total={
                      generalHighSchoolCount
                    }
                    color="green"
                    isDirector={
                      isDirector
                    }
                    processingId={
                      processingId
                    }
                    onTeam={
                      loadClassTeam
                    }
                    onValidate={
                      handleValidate
                    }
                    onReject={
                      handleReject
                    }
                    onDelete={
                      handleDelete
                    }
                  />

                  <CycleTable
                    title="Lycée technique"
                    classes={filteredClasses.filter(
                      (item) =>
                        item.cycleName
                          .toLowerCase()
                          .trim() ===
                        "lycée technique"
                    )}
                    total={
                      technicalHighSchoolCount
                    }
                    color="indigo"
                    isDirector={
                      isDirector
                    }
                    processingId={
                      processingId
                    }
                    onTeam={
                      loadClassTeam
                    }
                    onValidate={
                      handleValidate
                    }
                    onReject={
                      handleReject
                    }
                    onDelete={
                      handleDelete
                    }
                  />
                </div>
              )}
            </section>

            {/* =================================================
                PANNEAU DROIT
            ================================================= */}

            <aside className="space-y-5">
              {/* DONUT */}

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Répartition par cycle
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      Classes validées
                    </p>
                  </div>

                  <BarChart3 className="h-4 w-4 text-gray-300" />
                </div>

                <div className="my-6 flex justify-center">
                  <DonutChart
                    primary={
                      primaryPercent
                    }
                    college={
                      collegePercent
                    }
                    highSchool={
                      highSchoolPercent
                    }
                    total={
                      cycleTotal
                    }
                  />
                </div>

                <div className="space-y-3">
                  <CycleLegend
                    label="Primaire"
                    value={
                      primaryCount
                    }
                    percent={
                      primaryPercent
                    }
                    dotClass="bg-[#6366F1]"
                  />

                  <CycleLegend
                    label="Collège"
                    value={
                      collegeCount
                    }
                    percent={
                      collegePercent
                    }
                    dotClass="bg-[#3B82F6]"
                  />

                  <CycleLegend
                    label="Lycée général"
                    value={
                      generalHighSchoolCount
                    }
                    percent={
                      highSchoolCount > 0
                        ? Math.round(
                            (generalHighSchoolCount /
                              highSchoolCount) *
                              100
                          )
                        : 0
                    }
                    dotClass="bg-[#10B981]"
                  />

                  <CycleLegend
                    label="Lycée technique"
                    value={
                      technicalHighSchoolCount
                    }
                    percent={
                      highSchoolCount > 0
                        ? Math.round(
                            (technicalHighSchoolCount /
                              highSchoolCount) *
                              100
                          )
                        : 0
                    }
                    dotClass="bg-[#6366F1]"
                  />
                </div>
              </div>

              {/* EN ATTENTE */}

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Classes en attente
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      {pendingClasses.length} demande(s)
                    </p>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                    <Clock3 className="h-4 w-4" />
                  </div>
                </div>

                {pendingClasses.length ===
                0 ? (
                  <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
                    <Check className="mx-auto h-5 w-5 text-emerald-500" />

                    <p className="mt-2 text-xs font-medium text-gray-500">
                      Aucune demande en attente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingClasses
                      .slice(0, 5)
                      .map(
                        (
                          item
                        ) => (
                          <button
                            key={
                              item.id
                            }
                            type="button"
                            onClick={() =>
                              setSelectedClass(
                                item
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <Clock3 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-gray-800">
                                {
                                  item.name
                                }
                              </p>

                              <p className="truncate text-[11px] text-gray-400">
                                {
                                  item.cycleName
                                }{" "}
                                •{" "}
                                {
                                  item.levelName
                                }
                              </p>
                            </div>

                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                          </button>
                        )
                      )}
                  </div>
                )}
              </div>

              {/* ACTIONS RAPIDES */}

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-900">
                    Actions rapides
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Outils de gestion
                  </p>
                </div>

                <div className="space-y-2">
                  <QuickAction
                    icon={
                      <Upload className="h-4 w-4" />
                    }
                    label="Importer des classes"
                    description="Excel"
                    iconClass="bg-indigo-50 text-indigo-600"
                    onClick={() =>
                      setShowImportModal(
                        true
                      )
                    }
                  />

                  <QuickAction
                    icon={
                      <ArrowDownToLine className="h-4 w-4" />
                    }
                    label="Exporter la liste"
                    description="CSV"
                    iconClass="bg-blue-50 text-blue-600"
                    onClick={
                      handleExport
                    }
                  />

                  <QuickAction
                    icon={
                      <BarChart3 className="h-4 w-4" />
                    }
                    label="Rapport par cycle"
                    description="Rapport"
                    iconClass="bg-emerald-50 text-emerald-600"
                    onClick={
                      handleCycleReport
                    }
                  />
                </div>
              </div>

              {/* MOBILE PREVIEW */}

              <div className="hidden rounded-2xl border border-gray-100 bg-[#F8FAFC] p-5 shadow-sm 2xl:block">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Aperçu mobile
                    </p>

                    <p className="text-[10px] text-gray-400">
                      Version condensée
                    </p>
                  </div>

                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                <div className="mx-auto w-[170px] overflow-hidden rounded-[24px] border-[5px] border-gray-800 bg-white shadow-lg">
                  <div className="bg-[#1A2451] px-3 py-3 text-white">
                    <p className="text-[9px] font-bold">
                      EduSoft CG
                    </p>

                    <p className="mt-2 text-[13px] font-bold">
                      Classes
                    </p>
                  </div>

                  <div className="space-y-2 p-3">
                    <div className="rounded-lg bg-indigo-50 p-2">
                      <p className="text-[8px] text-gray-400">
                        Total classes
                      </p>

                      <p className="mt-1 text-sm font-bold text-indigo-600">
                        {
                          totalClasses
                        }
                      </p>
                    </div>

                    {filteredClasses
                      .slice(0, 2)
                      .map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="rounded-lg border border-gray-100 p-2"
                          >
                            <p className="truncate text-[9px] font-bold text-gray-700">
                              {
                                item.name
                              }
                            </p>

                            <p className="mt-1 text-[8px] text-gray-400">
                              {
                                item.levelName
                              }
                            </p>
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* =====================================================
          MODAL CRÉATION
      ===================================================== */}

      {showCreateModal && (
        <Modal
          title="Nouvelle classe"
          subtitle={
            isTeacher
              ? "Votre demande sera soumise au directeur."
              : "Créez une nouvelle classe pour votre établissement."
          }
          onClose={
            closeCreateModal
          }
          maxWidth="max-w-2xl"
        >
          {errorMessage && (
            <AlertBox
              message={
                errorMessage
              }
              type="error"
            />
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Cycle">
              <select
                value={
                  selectedCycle
                }
                onChange={(
                  event
                ) =>
                  handleCycleChange(
                    event.target
                      .value
                  )
                }
                className="form-select"
              >
                <option value="">
                  Sélectionner un cycle
                </option>

                {cycles.map(
                  (cycle) => (
                    <option
                      key={
                        cycle.id
                      }
                      value={
                        cycle.id
                      }
                    >
                      {
                        cycle.name
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Niveau">
              <select
                value={
                  selectedLevel
                }
                onChange={(
                  event
                ) =>
                  setSelectedLevel(
                    event.target
                      .value
                  )
                }
                disabled={
                  !selectedCycle
                }
                className="form-select disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Sélectionner un niveau
                </option>

                {availableLevels.map(
                  (
                    level
                  ) => (
                    <option
                      key={
                        level.id
                      }
                      value={
                        level.id
                      }
                    >
                      {
                        level.name
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          {isHighSchool && (
            <div className="mt-5">
              <FormField label="Série">
                <select
                  value={
                    selectedSeries
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedSeries(
                      event.target
                        .value
                    )
                  }
                  className="form-select"
                >
                  <option value="">
                    Sélectionner une série
                  </option>

                  {availableSeries.map(
                    (
                      item
                    ) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {
                          item.name
                        }
                      </option>
                    )
                  )}
                </select>
              </FormField>
            </div>
          )}

          <div className="mt-5">
            <FormField label="Nom de la classe">
              <input
                type="text"
                value={
                  className
                }
                onChange={(
                  event
                ) =>
                  setClassName(
                    event.target
                      .value
                  )
                }
                placeholder="Ex. CM2 A, 6ème B, 2nde D1..."
                className="form-input"
              />
            </FormField>
          </div>

          <div className="mt-5">
            <FormField label="Année scolaire">
              <select
                value={
                  selectedAcademicYear
                }
                onChange={(
                  event
                ) =>
                  setSelectedAcademicYear(
                    event.target
                      .value
                  )
                }
                className="form-select"
              >
                <option value="">
                  Sélectionner une année
                </option>

                {academicYears.map(
                  (
                    year
                  ) => (
                    <option
                      key={
                        year.id
                      }
                      value={
                        year.id
                      }
                    >
                      {
                        year.name
                      }
                      {year.is_active
                        ? " — Active"
                        : ""}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={
                closeCreateModal
              }
              disabled={saving}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={
                handleCreateClass
              }
              disabled={
                saving
              }
              className="rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? "Création..."
                : isTeacher
                ? "Envoyer la demande"
                : "Créer la classe"}
            </button>
          </div>
        </Modal>
      )}

      {/* =====================================================
          MODAL IMPORT EXCEL
      ===================================================== */}

      {showImportModal && (
        <Modal
          title="Importer des classes"
          subtitle="Importez plusieurs classes à partir d'un fichier Excel."
          onClose={() => {
            if (
              importLoading
            )
              return;

            setShowImportModal(
              false
            );
            setImportRows([]);
            setImportFileName(
              ""
            );
            setErrorMessage(
              ""
            );
          }}
          maxWidth="max-w-3xl"
        >
          {errorMessage && (
            <AlertBox
              message={
                errorMessage
              }
              type="error"
            />
          )}

          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
              <FileSpreadsheet className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-gray-800">
              Importer un fichier Excel
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
              Colonnes attendues :
              <strong>
                {" "}
                Classe, Cycle,
                Niveau
              </strong>{" "}
              et
              éventuellement
              <strong>
                {" "}
                Série
              </strong>
              .
            </p>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept=".xlsx,.xls"
              onChange={
                handleExcelFile
              }
              className="hidden"
            />

            <button
              type="button"
              disabled={
                importLoading
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Choisir un fichier
            </button>

            {importFileName && (
              <p className="mt-3 text-xs font-medium text-indigo-600">
                {importFileName}
              </p>
            )}
          </div>

          {importRows.length >
            0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Aperçu
                  </h3>

                  <p className="text-xs text-gray-400">
                    {
                      importRows.length
                    }{" "}
                    ligne(s)
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {
                    importRows.length
                  }{" "}
                  classes
                </span>
              </div>

              <div className="max-h-64 overflow-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3">
                        Classe
                      </th>

                      <th className="px-4 py-3">
                        Cycle
                      </th>

                      <th className="px-4 py-3">
                        Niveau
                      </th>

                      <th className="px-4 py-3">
                        Série
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {importRows
                      .slice(
                        0,
                        100
                      )
                      .map(
                        (
                          row,
                          index
                        ) => (
                          <tr
                            key={
                              `${row.name}-${index}`
                            }
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3 font-semibold text-gray-700">
                              {
                                row.name
                              }
                            </td>

                            <td className="px-4 py-3 text-gray-500">
                              {
                                row.cycle
                              }
                            </td>

                            <td className="px-4 py-3 text-gray-500">
                              {
                                row.level
                              }
                            </td>

                            <td className="px-4 py-3 text-gray-500">
                              {row.series ||
                                "—"}
                            </td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <FormField label="Année scolaire">
                  <select
                    value={
                      selectedAcademicYear
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedAcademicYear(
                        event.target
                          .value
                      )
                    }
                    className="form-select"
                  >
                    {academicYears.map(
                      (
                        year
                      ) => (
                        <option
                          key={
                            year.id
                          }
                          value={
                            year.id
                          }
                        >
                          {
                            year.name
                          }
                          {year.is_active
                            ? " — Active"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </FormField>
              </div>

              {importLoading && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs text-gray-500">
                    <span>
                      Importation...
                    </span>

                    <span>
                      {
                        importProgress
                      }
                      %
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#6366F1] transition-all"
                      style={{
                        width: `${importProgress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setImportRows(
                      []
                    )
                  }
                  disabled={
                    importLoading
                  }
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Effacer
                </button>

                <button
                  type="button"
                  onClick={
                    handleImportClasses
                  }
                  disabled={
                    importLoading
                  }
                  className="flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Importer les classes
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* =====================================================
          MODAL ÉQUIPE
      ===================================================== */}

      {showTeamModal &&
        selectedClassForTeam && (
          <Modal
            title="Équipe pédagogique"
            subtitle={`Classe : ${selectedClassForTeam.name}`}
            onClose={
              closeTeamModal
            }
            maxWidth="max-w-3xl"
          >
            {errorMessage && (
              <AlertBox
                message={
                  errorMessage
                }
                type="error"
              />
            )}

            {teamLoading ? (
              <div className="py-12 text-center">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />

                <p className="mt-3 text-sm text-gray-500">
                  Chargement...
                </p>
              </div>
            ) : (
              <div className="space-y-6">

        
                {/* AJOUT MATIÈRE */}
{/* ENSEIGNANT PRINCIPAL — PRIMAIRE */}

{selectedClassForTeam &&
  getCycleName(selectedClassForTeam.cycle_id)
    .toLowerCase()
    .includes("primaire") ? (
  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
    <div className="mb-3">
      <h3 className="text-sm font-bold text-gray-900">
        Enseignant principal
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        Pour le primaire, cet enseignant sera automatiquement
        responsable de toutes les matières de la classe.
      </p>
    </div>

    <select
      value={selectedPrincipalTeacher}
      onChange={(event) =>
  handlePrincipalTeacherChange(
    event.target.value
  )
}
      className="form-select w-full"
    >
      <option value="">
        Sélectionner un enseignant
      </option>

      {teachers.map((teacher) => (
        <option
          key={teacher.id}
          value={teacher.id}
        >
          {getTeacherName(teacher.id)}
        </option>
      ))}
    </select>
  </div>
) : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
  <select
    value={selectedSubject}
    onChange={(event) =>
      setSelectedSubject(
        event.target.value
      )
    }
    className="form-select flex-1"
  >
    <option value="">
      Sélectionner une matière
    </option>

    {subjects
      .filter(
        (subject) =>
          !classSubjects.some(
            (item) =>
              item.subject_id ===
              subject.id
          )
      )
      .map((subject) => (
        <option
          key={subject.id}
          value={subject.id}
        >
          {subject.name}
        </option>
      ))}
  </select>

  <input
    type="number"
    min="1"
    value={selectedSubjectCoefficient}
    onChange={(event) =>
      setSelectedSubjectCoefficient(
        Number(event.target.value)
      )
    }
    className="form-input sm:w-28"
    placeholder="Coef."
  />

  <button
    type="button"
    onClick={handleAddSubject}
    disabled={
      teamSaving ||
      !selectedSubject
    }
    className="flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
  >
    <Plus className="h-4 w-4" />
    Ajouter
  </button>
</div>

                {/* MATIÈRES */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">
                      Matières de la classe
                    </h3>

                    <span className="text-xs text-gray-400">
                      {
                        classSubjects.length
                      }{" "}
                      matière(s)
                    </span>
                  </div>

                  {classSubjects.length ===
                  0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
                      <BookOpen className="mx-auto h-6 w-6 text-gray-300" />

                      <p className="mt-2 text-sm font-medium text-gray-500">
                        Aucune matière affectée
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classSubjects.map(
                        (
                          classSubject
                        ) => {
                          const subject =
                            subjects.find(
                              (
                                item
                              ) =>
                                item.id ===
                                classSubject.subject_id
                            );

                          const assignment =
                            teacherSubjects.find(
                              (
                                item
                              ) =>
                                item.subject_id ===
                                  classSubject.subject_id &&
                                item.class_id ===
                                  selectedClassForTeam.id &&
                                item.academic_year_id ===
                                  selectedClassForTeam.academic_year_id
                            );

                          return (
                            <div
                              key={
                                classSubject.id
                              }
                              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <BookOpen className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="text-sm font-bold text-gray-800">
                                      {subject?.name ||
                                        "Matière inconnue"}
                                    </p>

                                   <p className="text-xs text-gray-400">
  Coefficient {classSubject.coefficient}
</p>
                                  </div>
                                </div>

                                <div className="min-w-[250px]">
                                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Enseignant
                                  </label>
                                  <select
  value={assignment?.teacher_id || ""}
  onChange={(event) =>
    handleTeacherChange(
      classSubject,
      event.target.value
    )
  }
  className="form-select"
>
  <option value="">
    Aucun enseignant
  </option>

  {teachers.map((teacher) => (
    <option
      key={teacher.id}
      value={teacher.id}
    >
      {getTeacherName(teacher.id)}
    </option>
  ))}
</select>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>
        )}

      {/* =====================================================
          MODAL DÉTAIL CLASSE EN ATTENTE
      ===================================================== */}

      {selectedClass && (
        <Modal
          title={
            selectedClass.name
          }
          subtitle="Demande de création de classe"
          onClose={() =>
            setSelectedClass(
              null
            )
          }
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <DetailRow
              label="Cycle"
              value={
                getCycleName(
                  selectedClass.cycle_id
                )
              }
            />

            <DetailRow
              label="Niveau"
              value={
                getLevelName(
                  selectedClass.level_id
                )
              }
            />

            <DetailRow
              label="Série"
              value={
                getSeriesName(
                  selectedClass.series_id
                ) ||
                "Aucune"
              }
            />

            <DetailRow
              label="Année scolaire"
              value={
                academicYears.find(
                  (year) =>
                    year.id ===
                    selectedClass.academic_year_id
                )?.name ||
                "—"
              }
            />

            <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">
                Statut
              </span>

              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                En attente
              </span>
            </div>

            {isDirector && (
              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={async () => {
                    await handleValidate(
                      selectedClass.id
                    );

                    setSelectedClass(
                      null
                    );
                  }}
                  disabled={
                    processingId ===
                    selectedClass.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Valider
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleReject(
                      selectedClass.id
                    );

                    setSelectedClass(
                      null
                    );
                  }}
                  disabled={
                    processingId ===
                    selectedClass.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Refuser
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-gray-400">
            {subtitle}
          </p>
        </div>

        <div
  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
>
  {icon}
</div>
      </div>
    </div>
  );
}

/* =========================================================
   CYCLE TABLE
========================================================= */

function CycleTable({
  title,
  classes,
  total,
  color,
  isDirector,
  processingId,
  onTeam,
  onValidate,
  onReject,
  onDelete,
}: {
  title: string;
  classes: ClassView[];
  total: number;
  color: "blue" | "indigo" | "green";
  isDirector: boolean;
  processingId: string | null;
  onTeam: (
    schoolClass: SchoolClass
  ) => void;
  onValidate: (
    classId: string
  ) => void;
  onReject: (
    classId: string
  ) => void;
  onDelete: (
    schoolClass: SchoolClass
  ) => void;
}) {
  const colors = {
    blue: {
      dot: "bg-[#6366F1]",
      soft: "bg-indigo-50 text-indigo-600",
    },
    indigo: {
      dot: "bg-[#3B82F6]",
      soft: "bg-blue-50 text-blue-600",
    },
    green: {
      dot: "bg-[#10B981]",
      soft: "bg-emerald-50 text-emerald-600",
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full ${colors[color].dot}`}
          />

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {title}
            </h3>

            <p className="mt-0.5 text-[11px] text-gray-400">
              Organisation pédagogique
            </p>
          </div>

          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
            {total}
          </span>
        </div>

        <button
  type="button"
  className="hidden text-xs font-semibold text-[#6366F1] hover:text-indigo-700 sm:block"
>
  Voir tout
</button>
      </div>

      {classes.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <GraduationCap className="mx-auto h-6 w-6 text-gray-300" />

          <p className="mt-2 text-xs font-medium text-gray-500">
            Aucune classe
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">
                    Classe
                  </th>

                  <th className="px-4 py-3">
                    Niveau
                  </th>

                  <th className="px-4 py-3">
                    Effectif
                  </th>

                  <th className="px-4 py-3">
                    Enseignant
                  </th>

                  <th className="px-4 py-3">
                    Statut
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {classes
                  .slice(0, 8)
                  .map(
                    (
                      schoolClass
                    ) => (
                      <ClassTableRow
                        key={
                          schoolClass.id
                        }
                        schoolClass={
                          schoolClass
                        }
                        isDirector={
                          isDirector
                        }
                        processingId={
                          processingId
                        }
                        onTeam={
                          onTeam
                        }
                        onValidate={
                          onValidate
                        }
                        onReject={
                          onReject
                        }
                        onDelete={
                          onDelete
                        }
                      />
                    )
                  )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="space-y-3 p-4 md:hidden">
            {classes
              .slice(0, 8)
              .map(
                (
                  schoolClass
                ) => (
                  <div
  key={schoolClass.id}
  className="rounded-xl border border-gray-100 p-4"
>
  <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {
                            schoolClass.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {
                            schoolClass.levelName
                          }

                          {schoolClass.seriesName &&
                            ` • ${schoolClass.seriesName}`}
                        </p>
                      </div>

                      <StatusBadge
                        status={
                          schoolClass.status
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[10px] text-gray-400">
                          Effectif
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-700">
                          {
                            schoolClass.studentCount
                          }
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[10px] text-gray-400">
                          Enseignant
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-gray-700">
                          {
                            schoolClass.principalTeacherName
                          }
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onTeam(
                          schoolClass
                        )
                      }
                      className="mt-3 w-full rounded-lg bg-indigo-50 py-2 text-xs font-semibold text-indigo-600"
                    >
                      Équipe pédagogique
                    </button>
                  </div>
                )
              )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   TABLE ROW
========================================================= */

function ClassTableRow({
  schoolClass,
  isDirector,
  processingId,
  onTeam,
  onValidate,
  onReject,
  onDelete,
}: {
  schoolClass: ClassView;
  isDirector: boolean;
  processingId: string | null;
  onTeam: (
    schoolClass: SchoolClass
  ) => void;
  onValidate: (
    classId: string
  ) => void;
  onReject: (
    classId: string
  ) => void;
  onDelete: (
    schoolClass: SchoolClass
  ) => void;
}) {
  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const isProcessing =
    processingId ===
    schoolClass.id;

  return (
    <tr className="border-t border-gray-100 transition hover:bg-gray-50/60">
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {schoolClass.name}
          </p>

          {schoolClass.seriesName && (
            <p className="mt-0.5 text-[10px] text-indigo-500">
              Série{" "}
              {
                schoolClass.seriesName
              }
            </p>
          )}
        </div>
      </td>

      <td className="px-4 py-4 text-xs font-medium text-gray-500">
        {
          schoolClass.levelName
        }
      </td>

      <td className="px-4 py-4">
        <span className="text-xs font-semibold text-gray-600">
          {
            schoolClass.studentCount
          }{" "}
          élève
          {schoolClass.studentCount !==
          1
            ? "s"
            : ""}
        </span>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <UserRound className="h-3.5 w-3.5" />
          </div>

          <span className="max-w-[150px] truncate text-xs font-medium text-gray-600">
            {
              schoolClass.principalTeacherName
            }
          </span>
        </div>
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={
            schoolClass.status
          }
        />
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-end">
          <div className="relative">
            <button
  type="button"
  onClick={() =>
    setMenuOpen((previous) => !previous)
  }
  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
>
  <MoreHorizontal className="h-4 w-4" />
</button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
                <button
  type="button"
  onClick={() => {
    onTeam(schoolClass);
    setMenuOpen(false);
  }}
  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
>
  <UsersRound className="h-4 w-4" />
  Équipe pédagogique
</button>

                

                {schoolClass.status ===
                  "pending" &&
                  isDirector && (
                    <>
                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() => {
                          onValidate(
                            schoolClass.id
                          );
                          setMenuOpen(
                            false
                          );
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Valider
                      </button>

                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() => {
                          onReject(
                            schoolClass.id
                          );
                          setMenuOpen(
                            false
                          );
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Refuser
                      </button>
                    </>
                  )}

                {schoolClass.status ===
                  "approved" &&
                  isDirector && (
                    <button
                      type="button"
                      disabled={
                        isProcessing
                      }
                      onClick={() => {
                        onDelete(
                          schoolClass
                        );
                        setMenuOpen(
                          false
                        );
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: SchoolClass["status"];
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
        <Check className="h-3 w-3" />
        Validée
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
        <XCircle className="h-3 w-3" />
        Refusée
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
      <Clock3 className="h-3 w-3" />
      En attente
    </span>
  );
}

/* =========================================================
   DONUT
========================================================= */

function DonutChart({
  primary,
  college,
  highSchool,
  total,
}: {
  primary: number;
  college: number;
  highSchool: number;
  total: number;
}) {
  const radius = 48;
  const circumference =
    2 *
    Math.PI *
    radius;

  const primaryLength =
    (primary / 100) *
    circumference;

  const collegeLength =
    (college / 100) *
    circumference;

  const highSchoolLength =
    (highSchool / 100) *
    circumference;

  return (
    <div className="relative h-44 w-44">
      <svg
        viewBox="0 0 120 120"
        className="-rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="13"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#6366F1"
          strokeWidth="13"
          strokeDasharray={`${primaryLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="13"
          strokeDasharray={`${collegeLength} ${circumference}`}
          strokeDashoffset={`-${primaryLength}`}
          strokeLinecap="round"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="13"
          strokeDasharray={`${highSchoolLength} ${circumference}`}
          strokeDashoffset={`-${
            primaryLength +
            collegeLength
          }`}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {total}
        </span>

        <span className="text-[10px] font-medium text-gray-400">
          Total classes
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   CYCLE LEGEND
========================================================= */

function CycleLegend({
  label,
  value,
  percent,
  dotClass,
}: {
  label: string;
  value: number;
  percent: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
      />

      <span className="flex-1 text-xs font-medium text-gray-600">
        {label}
      </span>

      <span className="text-xs font-bold text-gray-800">
        {value}
      </span>

      <span className="w-10 text-right text-[10px] text-gray-400">
        {percent}%
      </span>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  label,
  description,
  iconClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  iconClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-gray-100 hover:bg-gray-50"
    >
      <div
  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
>
  {icon}
</div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-700">
          {label}
        </p>

        <p className="mt-0.5 text-[10px] text-gray-400">
          {description}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-gray-300" />
    </button>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  subtitle,
  children,
  onClose,
  maxWidth,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${maxWidth}`}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-gray-700">
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   ALERT
========================================================= */

function AlertBox({
  message,
  type,
}: {
  message: string;
  type: "error" | "success";
}) {
  return (
    <div
      className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {message}
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-xs font-medium text-gray-400">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm font-semibold text-gray-700">
        {value}
      </span>
    </div>
  );
}