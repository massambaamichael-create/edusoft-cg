"use client";

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
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
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
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherEmployeeNumber, setTeacherEmployeeNumber] = useState("");
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("school_id, first_name, last_name")
        .eq("auth_user_id", session.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error("ERREUR PROFIL UTILISATEUR :", profileError);
        setLoading(false);
        return;
      }

      setSchoolId(userProfile.school_id);
      const fullName = [userProfile.first_name, userProfile.last_name]
        .filter(Boolean)
        .join(" ");
      if (fullName) setUserName(fullName);

      const [{ count }, { count: teachersCount }, { count: classesCount }] =
        await Promise.all([
          supabase.from("students").select("*", { count: "exact", head: true }),
          supabase.from("teachers").select("*", { count: "exact", head: true }),
          supabase.from("classes").select("*", { count: "exact", head: true }),
        ]);

      setStudentCount(count ?? 0);
      setTeacherCount(teachersCount ?? 0);
      setClassCount(classesCount ?? 0);

      const today = new Date().toISOString().split("T")[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("student_attendance")
        .select("status")
        .eq("attendance_date", today);

      if (!attendanceError && attendanceData?.length) {
        const presentCount = attendanceData.filter(
          (item) => item.status?.toLowerCase() === "present"
        ).length;
        setAttendanceRate(
          Math.round((presentCount / attendanceData.length) * 100)
        );
      }

      setLoading(false);
    };

    checkAuth();
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
          <p className="mt-4 text-sm text-white/50">Chargement d'EduSoft CG...</p>
        </div>
      </main>
    );
  }

  const kpis = [
    { label: "Élèves", value: studentCount, note: "Effectif actuel", icon: Users, accent: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Enseignants", value: teacherCount, note: "Personnel enseignant", icon: GraduationCap, accent: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Classes", value: classCount, note: "Classes enregistrées", icon: School, accent: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Présence élèves", value: `${attendanceRate}%`, note: "Aujourd'hui", icon: Activity, accent: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Année scolaire", value: "Active", note: "Contexte courant", icon: CalendarDays, accent: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "Direction", value: "Global", note: "Vue établissement", icon: LayoutDashboard, accent: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <main className="min-h-screen bg-[#080B16] text-white">
      <Sidebar userProfile={{ first_name: userName }} userRole="Directeur Général" />

      <section className="ml-[270px] min-w-0">
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
              <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">Vue d'ensemble</h2>
              <p className="mt-1 text-sm text-white/40">La situation de votre établissement en un coup d'œil.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs text-white/50">
              <CalendarDays size={15} /> Année scolaire active
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
                  <button className="text-xs font-semibold text-violet-400 hover:text-violet-300">Voir tout</button>
                </div>
                <div className="mt-5 space-y-1">
                  {[
                    ["Effectif élèves", `${studentCount} élèves actuellement enregistrés`],
                    ["Équipe pédagogique", `${teacherCount} enseignants enregistrés`],
                    ["Structure", `${classCount} classes enregistrées`],
                    ["Présence", `${attendanceRate}% de présence calculée aujourd'hui`],
                  ].map(([title, detail]) => (
                    <div key={title} className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.025]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-emerald-400"><CheckCircle2 size={16} /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="truncate text-xs text-white/30">{detail}</p></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5 xl:col-span-4">
              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-semibold">Calendrier du jour</h3><p className="mt-1 text-xs text-white/35">Votre agenda de direction.</p></div>
                  <CalendarDays size={18} className="text-white/30" />
                </div>
                <div className="mt-5 space-y-3">
                  {["08:00  Conseil pédagogique", "10:30  Réunion des enseignants", "14:00  Examens blancs", "16:00  Rencontre parents"].map((event) => (
                    <div key={event} className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                      <span className="h-2 w-2 translate-y-1.5 rounded-full bg-violet-400" />
                      <p className="text-sm text-white/65">{event}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5 lg:p-6">
                <div className="flex items-center justify-between"><div><h3 className="font-semibold">Présence aujourd'hui</h3><p className="mt-1 text-xs text-white/35">Indicateurs disponibles.</p></div><Activity size={18} className="text-emerald-400" /></div>
                <div className="mt-6 flex justify-around">
                  <div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500/30 text-lg font-bold">{attendanceRate}%</div><p className="mt-2 text-xs text-white/40">Élèves</p></div>
                  <div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-500/30 text-lg font-bold">—</div><p className="mt-2 text-xs text-white/40">Enseignants</p></div>
                  <div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-violet-500/30 text-lg font-bold">—</div><p className="mt-2 text-xs text-white/40">Personnel</p></div>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-[#17102D] via-[#100D20] to-[#0D1220] p-5 lg:p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-600/15 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Sparkles size={19} /></div>
                  <h3 className="mt-4 font-semibold">IA EduSoft</h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">Assistant intelligent pour analyser votre établissement et vous aider à identifier les prochaines actions.</p>
                  <button className="mt-5 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold hover:bg-violet-500">Ouvrir l'assistant <ArrowRight size={14} /></button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220] p-5 lg:p-6">
                <div className="flex items-center justify-between"><div><h3 className="font-semibold">État financier</h3><p className="mt-1 text-xs text-white/35">Module financier.</p></div><Settings size={17} className="text-white/25" /></div>
                <div className="mt-5 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4"><p className="text-sm text-white/55">Les données financières seront affichées ici lorsque le module Finances sera disponible.</p></div>
              </section>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/[0.07] bg-[#0D1220] p-3">
            <span className="px-2 py-2 text-xs font-semibold text-white/35">Raccourcis</span>
            {[
              ["Importer Excel", ""],
              ["Exporter PDF", ""],
              ["Créer une classe", "/pedagogie/classes"],
              ["Créer une matière", "/pedagogie/matieres"],
              ["Créer un examen", ""],
              ["Créer un utilisateur", ""],
            ].map(([label, href]) => (
              <button key={label} onClick={() => href && router.push(href)} className="rounded-lg bg-white/[0.035] px-3 py-2 text-xs text-white/50 transition hover:bg-white/[0.07] hover:text-white">{label}</button>
            ))}
          </div>
        </div>
      </section>

      {showTeacherModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-bold">Ajouter un enseignant</h2><p className="mt-1 text-xs text-white/35">Création via le processus existant EduSoft CG.</p></div>
              <button onClick={() => setShowTeacherModal(false)} className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"><X size={18} /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Prénom", teacherFirstName, setTeacherFirstName, "Jean"],
                ["Nom", teacherLastName, setTeacherLastName, "Dupont"],
                ["Email", teacherEmail, setTeacherEmail, "enseignant@ecole.cg"],
                ["Téléphone", teacherPhone, setTeacherPhone, "+242 ..."],
                ["Numéro matricule", teacherEmployeeNumber, setTeacherEmployeeNumber, "ENS-001"],
              ].map(([label, value, setter, placeholder], index) => (
                <label key={label as string} className={index === 4 ? "sm:col-span-2" : ""}>
                  <span className="mb-1.5 block text-xs font-medium text-white/55">{label as string}</span>
                  <input value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} placeholder={placeholder as string} className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm outline-none placeholder:text-white/20 focus:border-violet-500/60" />
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowTeacherModal(false)} className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-white/55 hover:text-white">Annuler</button>
              <button disabled={teacherSaving} onClick={handleCreateTeacher} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{teacherSaving ? "Création..." : "Créer l'enseignant"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
