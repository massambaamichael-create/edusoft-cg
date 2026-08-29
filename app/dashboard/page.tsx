"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  UserPlus,
  UserRoundPlus,
  Plus,
  FileText,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

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
const handleCreateTeacher = async () => {
  if (!teacherFirstName.trim()) {
    alert("Veuillez saisir le prénom de l'enseignant.");
    return;
  }

  if (!teacherLastName.trim()) {
    alert("Veuillez saisir le nom de l'enseignant.");
    return;
  }

  if (!teacherEmail.trim()) {
    alert("Veuillez saisir l'adresse email de l'enseignant.");
    return;
  }

  if (!teacherPhone.trim()) {
    alert("Veuillez saisir le numéro de téléphone de l'enseignant.");
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

  try {
    const response = await fetch("/api/teachers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: teacherFirstName.trim(),
        last_name: teacherLastName.trim(),
        email: teacherEmail.trim(),
        phone: teacherPhone.trim(),
        school_id: schoolId,
        employee_number: teacherEmployeeNumber.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("ERREUR CRÉATION ENSEIGNANT :", result);

      alert(
        result.error ??
          "Une erreur est survenue lors de la création de l'enseignant."
      );

      return;
    }

    console.log("ENSEIGNANT CRÉÉ :", result);

    alert(
      `Enseignant créé avec succès.\n\nUn email contenant ses identifiants de connexion a été envoyé à ${teacherEmail.trim()}.`
    );
  } catch (error) {
    console.error("ERREUR REQUÊTE ENSEIGNANT :", error);

    alert(
      "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
    );
  }
};
  useEffect(() => {
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

console.log("SCHOOL ID DU DIRECTEUR :", userProfile.school_id);

      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (!error) {
        setStudentCount(count ?? 0);
      }
const { count: teachersCount, error: teachersError } = await supabase
  .from("teachers")
  .select("*", { count: "exact", head: true });

if (!teachersError) {
  setTeacherCount(teachersCount ?? 0);
}
const { count: classesCount, error: classesError } = await supabase
  .from("classes")
  .select("*", { count: "exact", head: true });

if (!classesError) {
  setClassCount(classesCount ?? 0);
}
const today = new Date().toISOString().split("T")[0];

const { data: attendanceData, error: attendanceError } = await supabase
  .from("student_attendance")
  .select("status")
  .eq("attendance_date", today);

if (!attendanceError && attendanceData && attendanceData.length > 0) {
  const presentCount = attendanceData.filter(
    (item) => item.status?.toLowerCase() === "present"
  ).length;

  const rate = Math.round(
    (presentCount / attendanceData.length) * 100
  );

  setAttendanceRate(rate);
}
      setUserName("Directeur");
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#6C2BD9] flex items-center justify-center text-white">
            <GraduationCap size={25} />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Chargement d'EduSoft CG...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] flex">

      {/* SIDEBAR */}
      <Sidebar
  userProfile={{
    first_name: userName,
  }}
  userRole="Directeur"
/>

      {/* ZONE PRINCIPALE */}
      <section className="ml-[270px] min-w-0 flex-1">

        {/* HEADER */}
        <header className="h-[82px] bg-white border-b border-gray-100 px-8 flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-400">
              Dimanche 9 août 2026
            </p>

            <h1 className="mt-1 text-xl font-bold text-gray-900">
              Bonjour, {userName} 👋
            </h1>
          </div>

          <div className="flex items-center gap-4">

            {/* RECHERCHE */}
            <div className="hidden lg:flex items-center w-[280px] h-10 bg-[#F7F8FC] rounded-xl px-3 gap-2">
              <Search size={17} className="text-gray-400" />

              <input
                type="text"
                placeholder="Rechercher un élève..."
                className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* NOTIFICATIONS */}
            <button
              type="button"
              className="relative w-10 h-10 rounded-xl bg-[#F7F8FC] flex items-center justify-center text-gray-500 hover:text-[#6C2BD9] transition"
            >
              <Bell size={19} strokeWidth={1.9} />

              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6C2BD9]" />
            </button>

            {/* PROFIL */}
            <div className="w-10 h-10 rounded-full bg-[#E9DDFB] text-[#6C2BD9] flex items-center justify-center font-bold">
              D
            </div>

          </div>

        </header>

        {/* CONTENU */}
        <div className="p-8">

          {/* TITRE */}
          <div className="mb-8">

            <h2 className="text-2xl font-bold text-gray-900">
              Vue d'ensemble
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gérez votre établissement depuis votre espace de direction.
            </p>

          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* ÉLÈVES */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#6C2BD9] flex items-center justify-center">
                  <Users size={21} />
                </div>

                <span className="text-xs text-gray-400">
                  Total
                </span>

              </div>

              <p className="mt-5 text-sm text-gray-500">
                Élèves
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                {studentCount}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Aucun élève enregistré
              </p>

            </div>

            {/* ENSEIGNANTS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <GraduationCap size={21} />
                </div>

                <span className="text-xs text-gray-400">
                  Total
                </span>

              </div>

              <p className="mt-5 text-sm text-gray-500">
                Enseignants
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                {teacherCount}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Aucun enseignant enregistré
              </p>

            </div>

            {/* CLASSES */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <School size={21} />
                </div>

                <span className="text-xs text-gray-400">
                  Total
                </span>

              </div>

              <p className="mt-5 text-sm text-gray-500">
                Classes
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                {classCount}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Aucune classe créée
              </p>

            </div>

            {/* PRÉSENCE */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <CalendarCheck size={21} />
                </div>

                <span className="text-xs text-gray-400">
                  Aujourd'hui
                </span>

              </div>

              <p className="mt-5 text-sm text-gray-500">
                Présence
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                {attendanceRate}%
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Aucune présence enregistrée
              </p>

            </div>

          </div>

          {/* GRAPHIQUES + PRIORITÉS */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">

            {/* GRAPHIQUE */}
            <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold text-gray-900">
                    Évolution des effectifs
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Suivi des élèves au cours de l'année scolaire
                  </p>
                </div>

                <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600">
                  <option>Cette année</option>
                </select>

              </div>

              {/* État vide du graphique */}
              <div className="h-[260px] mt-6 rounded-xl bg-[#F7F8FC] flex flex-col items-center justify-center">

                <div className="w-12 h-12 rounded-xl bg-white text-[#6C2BD9] flex items-center justify-center shadow-sm">
                  <ArrowUpRight size={22} />
                </div>

                <p className="mt-4 text-sm font-medium text-gray-600">
                  Pas encore de données
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Le graphique apparaîtra lorsque les élèves seront enregistrés.
                </p>

              </div>

            </div>

            {/* PRIORITÉS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold text-gray-900">
                    Priorités du jour
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    À traiter aujourd'hui
                  </p>
                </div>

                <Clock3 size={19} className="text-gray-400" />

              </div>

              <div className="mt-6 space-y-3">

                <div className="p-4 rounded-xl bg-[#F7F8FC] flex gap-3">

                  <AlertCircle
                    size={19}
                    className="text-orange-500 shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Aucune priorité
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Les alertes apparaîtront ici.
                    </p>
                  </div>

                </div>

                <div className="p-4 rounded-xl bg-[#F7F8FC] flex gap-3">

                  <CheckCircle2
                    size={19}
                    className="text-green-500 shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Tout est à jour
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Rien à traiter pour le moment.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ACTIONS RAPIDES + RECHERCHE */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">

            {/* ACTIONS RAPIDES */}
            <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="mb-6">

                <h3 className="font-bold text-gray-900">
                  Actions rapides
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Les fonctions les plus utilisées.
                </p>

              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <button className="p-5 rounded-xl bg-[#F7F8FC] hover:bg-purple-50 transition text-left group">

                  <UserPlus
                    size={22}
                    className="text-[#6C2BD9] group-hover:scale-110 transition"
                  />

                  <p className="mt-4 text-sm font-semibold text-gray-900">
                    Ajouter un élève
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Nouveau dossier
                  </p>

                </button>

                <button
  type="button"
  onClick={() => setShowTeacherModal(true)}
  className="p-5 rounded-xl bg-[#F7F8FC]
  hover:bg-purple-50 transition text-left group"
>
  <UserRoundPlus
    size={22}
    className="text-[#6C2BD9] group-hover:scale-110 transition"
  />

  <p className="mt-4 text-sm font-semibold text-gray-900">
    Enseignant
  </p>

  <p className="mt-1 text-xs text-gray-400">
    Ajouter
  </p>
</button>

                <button className="p-5 rounded-xl bg-[#F7F8FC] hover:bg-purple-50 transition text-left group">

                  <Plus
                    size={22}
                    className="text-[#6C2BD9] group-hover:scale-110 transition"
                  />

                  <p className="mt-4 text-sm font-semibold text-gray-900">
                    Créer une classe
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Nouvelle classe
                  </p>

                </button>

                <button className="p-5 rounded-xl bg-[#F7F8FC] hover:bg-purple-50 transition text-left group">

                  <FileText
                    size={22}
                    className="text-[#6C2BD9] group-hover:scale-110 transition"
                  />

                  <p className="mt-4 text-sm font-semibold text-gray-900">
                    Documents
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Générer
                  </p>

                </button>

              </div>

            </div>

            {/* RECHERCHE RAPIDE */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6C2BD9] flex items-center justify-center">
                  <Search size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Recherche rapide
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Retrouvez un élève
                  </p>
                </div>

              </div>

              <div className="mt-5">

                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 h-11">

                  <Search size={17} className="text-gray-400" />

                  <input
                    type="text"
                    placeholder="Nom ou matricule..."
                    className="w-full outline-none text-sm"
                  />

                </div>

              </div>

              <div className="mt-5 p-4 rounded-xl bg-[#F7F8FC] text-center">

                <p className="text-sm text-gray-500">
                  Aucun résultat
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Les élèves apparaîtront ici.
                </p>

              </div>

            </div>

          </div>

          {/* IA + FINANCES */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">

            {/* IA */}
            <div className="xl:col-span-2 rounded-2xl p-6 shadow-sm bg-gradient-to-br from-[#6C2BD9] to-[#4B1FA8] text-white">

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <Sparkles size={19} />

                    <span className="text-sm font-semibold">
                      Assistant EduSoft
                    </span>

                  </div>

                  <h3 className="mt-4 text-xl font-bold">
                    Votre assistant administratif
                  </h3>

                  <p className="mt-2 text-sm text-purple-100 max-w-xl">
                    L'assistant IA pourra analyser les données de votre
                    établissement, répondre à vos questions et vous aider
                    dans vos tâches administratives.
                  </p>

                </div>

                <Sparkles
                  size={42}
                  className="text-purple-200/40"
                />

              </div>

              <button
                type="button"
                className="mt-6 px-5 py-2.5 rounded-xl bg-white text-[#6C2BD9] text-sm font-semibold hover:bg-purple-50 transition"
              >
                Ouvrir l'assistant
              </button>

            </div>

            {/* FINANCES */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

              <h3 className="font-bold text-gray-900">
                État financier
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Situation actuelle
              </p>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Recettes
                  </span>

                  <span className="font-semibold text-gray-900">
                    0 FCFA
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Impayés
                  </span>

                  <span className="font-semibold text-gray-900">
                    0 FCFA
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Dépenses
                  </span>

                  <span className="font-semibold text-gray-900">
                    0 FCFA
                  </span>

                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">

                  <span className="text-sm font-semibold text-gray-700">
                    Solde
                  </span>

                  <span className="text-lg font-bold text-[#6C2BD9]">
                    0 FCFA
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {showTeacherModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Ajouter un enseignant
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            Créez le profil d'un nouvel enseignant.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTeacherModal(false)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>

      </div>

      {/* CONTENU */}
      <div className="p-6">

        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-sm font-medium text-[#6C2BD9]">
            École sélectionnée
          </p>

          <p className="mt-1 text-xs text-purple-600">
            {schoolId}
          </p>
        </div>

        <div>
  <label className="block text-sm font-medium text-gray-700">
    Prénom
  </label>

  <input
    type="text"
    placeholder="Ex. Jean"
    value={teacherFirstName}
    onChange={(e) => setTeacherFirstName(e.target.value)}
    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100"
  />
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Nom
  </label>

  <input
  type="text"
  placeholder="Ex. Dupont"
  value={teacherLastName}
  onChange={(e) => setTeacherLastName(e.target.value)}
  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100"
/>
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Email
  </label>

  <input
  type="email"
  placeholder="Ex. jean.dupont@email.com"
  value={teacherEmail}
  onChange={(e) => setTeacherEmail(e.target.value)}
  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100"
/>
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Téléphone
  </label>

  <input
  type="tel"
  placeholder="Ex. +242 06 123 45 67"
  value={teacherPhone}
  onChange={(e) => setTeacherPhone(e.target.value)}
  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100"
/>
</div>
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700">
    Numéro matricule
  </label>

  <input
  type="text"
  placeholder="Ex. ENS-2026-001"
  value={teacherEmployeeNumber}
  onChange={(e) => setTeacherEmployeeNumber(e.target.value)}
  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100"
/>
</div>
<div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
  <button
    type="button"
    onClick={() => setShowTeacherModal(false)}
    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
  >
    Annuler
  </button>

  <button
    type="button"
    onClick={handleCreateTeacher}
    className="rounded-xl bg-[#6C2BD9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B21B6]"
  >
    Créer l'enseignant
  </button>
</div>

      </div>

    </div>

  </div>
)}

    </main>
  );
}