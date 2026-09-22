"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional data loading */


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Plus,
  School,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  X,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type QuickActionProps = {
  label: string;
  icon: typeof Plus;
  className: string;
  onClick?: () => void;
};

const quickActions: QuickActionProps[] = [
  {
    label: "Inscrire un élève",
    icon: UserPlus,
    className: "bg-[#6C2BD9] hover:bg-[#7c3aed]",
  },
  {
    label: "Réinscrire un élève",
    icon: GraduationCap,
    className: "bg-cyan-600 hover:bg-cyan-500",
  },
  {
    label: "Ajouter un enseignant",
    icon: UserPlus,
    className: "bg-emerald-600 hover:bg-emerald-500",
  },
  {
    label: "Enregistrer un paiement",
    icon: Plus,
    className: "bg-orange-500 hover:bg-orange-400",
  },
  {
    label: "Générer un bulletin",
    icon: BookOpen,
    className: "bg-green-600 hover:bg-green-500",
  },
  {
    label: "Envoyer une annonce",
    icon: MessageSquare,
    className: "bg-pink-600 hover:bg-pink-500",
  },
  {
    label: "Importer Excel",
    icon: LayoutDashboard,
    className: "bg-teal-600 hover:bg-teal-500",
  },
  {
    label: "Ajouter une classe",
    icon: School,
    className: "bg-blue-600 hover:bg-blue-500",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Directeur");
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
const [academicYearName, setAcademicYearName] = useState("Année scolaire");
const [configuredClassCount, setConfiguredClassCount] = useState(0);
const [subjectAssignmentCount, setSubjectAssignmentCount] = useState(0);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherEmployeeNumber, setTeacherEmployeeNumber] = useState("");
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
  let mounted = true;

  setTodayLabel(
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date())
  );

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("school_id, first_name, last_name")
        .eq("auth_user_id", session.user.id)
        .single();

      if (!mounted) return;

      if (profileError || !userProfile) {
        console.error("ERREUR PROFIL UTILISATEUR :", profileError);
        setLoading(false);
        return;
      }

      setSchoolId(userProfile.school_id);

      const { data: activeYear, error: activeYearError } = await supabase
        .from("academic_years")
        .select("id, name")
        .eq("school_id", userProfile.school_id)
        .eq("is_active", true)
        .single();

      if (!mounted) return;

      if (activeYearError && activeYearError.code !== "PGRST116") {
        throw activeYearError;
      }

      setAcademicYearId(activeYear?.id ?? null);
      setAcademicYearName(activeYear?.name ?? "Aucune année active");

      const fullName = [userProfile.first_name, userProfile.last_name]
        .filter(Boolean)
        .join(" ");

      if (fullName) {
        setUserName(fullName);
      }

      const [
        { count: studentsCount, error: studentsError },
        { count: teachersCount, error: teachersError },
        { count: classesCount, error: classesError },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id),

        supabase
          .from("teachers")
          .select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id),

        supabase
          .from("classes")
          .select("*", { count: "exact", head: true })
          .eq("school_id", userProfile.school_id)
          .eq("academic_year_id", activeYear?.id ?? ""),
      ]);

      if (!mounted) return;

      if (studentsError) throw studentsError;
      if (teachersError) throw teachersError;
      if (classesError) throw classesError;

      setStudentCount(studentsCount ?? 0);
      setTeacherCount(teachersCount ?? 0);
      setClassCount(classesCount ?? 0);

      const [
        { count: configuredClassesCount, error: configuredClassesError },
        { count: subjectAssignmentsCount, error: subjectAssignmentsError },
      ] = await Promise.all([
        supabase
          .from("class_subjects")
          .select("*", { count: "exact", head: true })
          .eq("academic_year_id", activeYear?.id ?? ""),

        supabase
          .from("teacher_subjects")
          .select("*", { count: "exact", head: true })
          .eq("academic_year_id", activeYear?.id ?? ""),
      ]);

      if (!mounted) return;

      if (configuredClassesError) throw configuredClassesError;
      if (subjectAssignmentsError) throw subjectAssignmentsError;

      setConfiguredClassCount(configuredClassesCount ?? 0);
      setSubjectAssignmentCount(subjectAssignmentsCount ?? 0);

      const today = new Date().toISOString().split("T")[0];

      const { data: attendanceData, error: attendanceError } =
        await supabase
          .from("student_attendance")
          .select("status")
          .eq("attendance_date", today);

      if (!mounted) return;

      if (attendanceError) {
        throw attendanceError;
      }

      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(
          (item) => item.status?.toLowerCase() === "present"
        ).length;

        setAttendanceRate(
          Math.round((presentCount / attendanceData.length) * 100)
        );
      } else {
        setAttendanceRate(0);
      }

      setLoading(false);
    } catch (error) {
      if (!mounted) return;

      console.error("ERREUR CHARGEMENT DASHBOARD :", error);
      setLoading(false);
    }
  };

  checkAuth();

  return () => {
    mounted = false;
  };
}, [router]);

  const handleCreateTeacher = async () => {
    if (!teacherFirstName.trim() || !teacherLastName.trim()) {
      alert("Veuillez saisir le prénom et le nom de l'enseignant.");
      return;
    }
    if (!teacherEmail.trim() || !teacherPhone.trim()) {
      alert("Veuillez saisir l'email et le téléphone de l'enseignant.");
      return;
    }
    if (!teacherEmployeeNumber.trim()) {
      alert("Veuillez saisir le numéro matricule de l'enseignant.");
      return;
    }
    if (!schoolId) {
      alert("Impossible de déterminer l'école du directeur.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("Votre session a expiré. Veuillez vous reconnecter.");
      router.replace("/");
      return;
    }

    setTeacherSaving(true);
    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          first_name: teacherFirstName.trim(),
          last_name: teacherLastName.trim(),
          email: teacherEmail.trim(),
          phone: teacherPhone.trim(),
          employee_number: teacherEmployeeNumber.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.error ?? "Une erreur est survenue lors de la création de l'enseignant.");
        return;
      }

      alert(
        `Enseignant créé avec succès.\n\nUn email contenant ses identifiants de connexion a été envoyé à ${teacherEmail.trim()}.`
      );
      setShowTeacherModal(false);
      setTeacherFirstName("");
      setTeacherLastName("");
      setTeacherEmail("");
      setTeacherPhone("");
      setTeacherEmployeeNumber("");
      setTeacherCount((current) => current + 1);
    } catch (error) {
      console.error("ERREUR REQUÊTE ENSEIGNANT :", error);
      alert("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      setTeacherSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080B16] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C2BD9] shadow-[0_0_35px_rgba(108,43,217,0.35)]">
            <GraduationCap size={25} />
          </div>
          <p className="mt-4 text-sm text-white/50">Chargement d{"'"}EduSoft CG...</p>
        </div>
      </main>
    );
  }

  const kpis = [
    { label: "Élèves", value: studentCount, note: "Effectif actuel", icon: Users, accent: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Enseignants", value: teacherCount, note: "Personnel enseignant", icon: GraduationCap, accent: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Classes", value: classCount, note: "Classes enregistrées", icon: School, accent: "text-orange-400", bg: "bg-orange-500/10" },
    {
  label: "Configuration pédagogique",
  value: configuredClassCount,
  note: "Classes avec matières",
  icon: BookOpen,
  accent: "text-indigo-400",
  bg: "bg-indigo-500/10",
},
{
  label: "Affectations",
  value: subjectAssignmentCount,
  note: "Enseignants / matières",
  icon: UserCheck,
  accent: "text-amber-400",
  bg: "bg-amber-500/10",
},
    { label: "Présence élèves", value: `${attendanceRate}%`, note: "Aujourd'hui", icon: Activity, accent: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Année scolaire", value: academicYearName, note: "Contexte courant", icon: CalendarDays, accent: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "Direction", value: "Global", note: "Vue établissement", icon: LayoutDashboard, accent: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <main className="min-h-screen bg-[#080B16] text-white">
      <section className="min-w-0">
        <header className="sticky top-0 z-40 flex min-h-[82px] items-center justify-between border-b border-white/[0.07] bg-[#080B16]/95 px-6 backdrop-blur-xl lg:px-8">
          <div>
            <p className="text-xs capitalize text-white/35">{todayLabel}</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">Bonjour, M. Directeur 👋</h1>
            <p className="mt-1 hidden text-xs text-white/35 sm:block">Bienvenue sur EduSoft CG - Smart School Management System</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden h-10 w-[250px] items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 lg:flex">
              <Search size={16} className="text-white/30" />
              <input
                placeholder="Rechercher un élève..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/25"
              />
            </div>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-white/60 hover:text-white">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500" />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-white/60 hover:text-white sm:flex">
              <MessageSquare size={17} />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-white/60 hover:text-white sm:flex">
              <CalendarDays size={17} />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold shadow-[0_0_25px_rgba(108,43,217,0.25)]">
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Direction générale
              </div>
              <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">Vue d{"'"}ensemble</h2>
              <p className="mt-1 text-sm text-white/40">La situation de votre établissement en un coup d{"'"}œil.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs text-white/50">
              <CalendarDays size={15} /> Année scolaire active : {academicYearName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.16)] transition hover:border-white/[0.12]">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.bg} ${kpi.accent}`}>
                    <Icon size={17} />
                  </div>
                  <p className="mt-4 text-xs text-white/40">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
                  <p className="mt-1 truncate text-[11px] text-white/25">{kpi.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="space-y-5 xl:col-span-8">
              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Priorités du jour</h3>
                    <p className="mt-1 text-xs text-white/35">Les actions qui méritent votre attention.</p>
                  </div>
                  <Clock3 size={18} className="text-white/30" />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    "Valider les éléments pédagogiques en attente",
                    "Vérifier les paiements en attente",
                    "Contrôler les absences du jour",
                    "Consulter les alertes établissement",
                  ].map((item, index) => (
                    <button key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 text-left hover:bg-white/[0.05]">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${index === 0 ? "bg-violet-500/15 text-violet-300" : "bg-white/[0.05] text-white/40"}`}>{index + 1}</span>
                      <span className="text-sm text-white/70">{item}</span>
                      <ArrowRight size={14} className="ml-auto shrink-0 text-white/20" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Actions rapides</h3>
                    <p className="mt-1 text-xs text-white/35">Accédez directement aux opérations fréquentes.</p>
                  </div>
                  <Plus size={18} className="text-white/30" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const onClick = action.label === "Ajouter un enseignant"
                      ? () => setShowTeacherModal(true)
                      : action.label === "Ajouter une classe"
                        ? () => router.push("/pedagogie/classes")
                        : undefined;
                    return (
                      <button key={action.label} onClick={onClick} className={`min-h-[82px] rounded-xl px-3 py-3 text-left text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${action.className}`}>
                        <Icon size={18} />
                        <span className="mt-3 block">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Activités récentes</h3>
                    <p className="mt-1 text-xs text-white/35">Les dernières opérations visibles dans votre espace.</p>
                  </div>
                  <button className="text-xs font-semibold text-violet-400">Voir tout</button>
                </div>
                <div className="mt-5 space-y-3">
                  {["Inscription élève enregistrée", "Paiement validé", "Classe mise à jour"].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-sm text-white/70">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5 xl:col-span-4">
              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5">
                <h3 className="font-semibold">Raccourcis</h3>
                <div className="mt-4 space-y-2">
                  {["/pedagogie/classes", "/administration/eleves", "/enseignants"].map((path) => (
                    <button key={path} onClick={() => router.push(path)} className="w-full rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 text-left text-sm text-white/70 hover:bg-white/[0.05]">{path}</button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1220] p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Ajouter un enseignant</h2>
              <button onClick={() => setShowTeacherModal(false)}><X size={18} /></button>
            </div>
            <div className="mt-4 grid gap-3">
              <input value={teacherFirstName} onChange={(e) => setTeacherFirstName(e.target.value)} placeholder="Prénom" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" />
              <input value={teacherLastName} onChange={(e) => setTeacherLastName(e.target.value)} placeholder="Nom" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" />
              <input value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" />
              <input value={teacherPhone} onChange={(e) => setTeacherPhone(e.target.value)} placeholder="Téléphone" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" />
              <input value={teacherEmployeeNumber} onChange={(e) => setTeacherEmployeeNumber(e.target.value)} placeholder="Matricule" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowTeacherModal(false)} className="rounded-xl px-4 py-2 text-sm text-white/60">Annuler</button>
              <button disabled={teacherSaving} onClick={handleCreateTeacher} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold">{teacherSaving ? "Enregistrement…" : "Créer l'enseignant"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
