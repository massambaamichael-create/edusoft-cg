"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, ChevronDown, GraduationCap, Mail, Phone, Plus, Search, UserRound, UsersRound, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { loadTeacherAssignmentsForAcademicYear, type TeacherAssignment } from "@/lib/pedagogie/teacherAssignments";

type UserProfile = { id: string; auth_user_id: string | null; school_id: string | null; first_name: string; last_name: string; email: string | null; phone: string | null; is_active: boolean | null };
type Teacher = { id: string; school_id: string | null; user_id: string | null; employee_number: string | null; created_at: string | null };
type Cycle = { id: string; school_id: string | null; name: string };
type Subject = { id: string; school_id: string | null; name: string; coefficient: number | null };
type AcademicYear = { id: string; school_id: string | null; name: string; is_active: boolean };
type SchoolClass = { id: string; school_id: string | null; cycle_id: string | null; level_id: string | null; series_id: string | null; academic_year_id: string | null; name: string; principal_teacher_id: string | null };
type Level = { id: string; name: string; cycle_id: string };
type Series = { id: string; name: string; category: string | null; cycle_id: string };
type ClassSubject = { id: string; class_id: string; subject_id: string; academic_year_id: string; coefficient: number };
type AssignmentView = { assignment: TeacherAssignment; classSubject: ClassSubject; subject: Subject | null; schoolClass: SchoolClass | null; cycle: Cycle | null };
type TeacherView = { teacher: Teacher; user: UserProfile | null; primaryClasses: SchoolClass[]; assignments: AssignmentView[]; lyceeGeneralSubjects: Subject[]; lyceeTechniqueSubjects: Subject[] };

export default function TeachersPage() {
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [search, setSearch] = useState("");
  const [cycleFilter, setCycleFilter] = useState<"Tous" | "Primaire" | "Collège" | "Lycée">("Tous");
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherEmployeeNumber, setTeacherEmployeeNumber] = useState("");
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = "/"; return; }
        const { data: profile, error: profileError } = await supabase.from("users").select("id, auth_user_id, school_id, first_name, last_name, email, phone, is_active").eq("auth_user_id", session.user.id).single();
        if (profileError || !profile?.school_id) throw new Error("Impossible de récupérer l'école associée à l'utilisateur.");
        setSchoolId(profile.school_id);

        const [teachersResponse, usersResponse, cyclesResponse, subjectsResponse, classesResponse, levelsResponse, seriesResponse, academicYearResponse] = await Promise.all([
          supabase.from("teachers").select("id, school_id, user_id, employee_number, created_at").eq("school_id", profile.school_id),
          supabase.from("users").select("id, auth_user_id, school_id, first_name, last_name, email, phone, is_active").eq("school_id", profile.school_id),
          supabase.from("cycles").select("id, school_id, name").eq("school_id", profile.school_id),
          supabase.from("subjects").select("id, school_id, name, coefficient").eq("school_id", profile.school_id),
          supabase.from("classes").select("id, school_id, cycle_id, level_id, series_id, academic_year_id, name, principal_teacher_id").eq("school_id", profile.school_id),
          supabase.from("levels").select("id, name, cycle_id").eq("school_id", profile.school_id),
          supabase.from("series").select("id, name, category, cycle_id").eq("school_id", profile.school_id),
          supabase.from("academic_years").select("id, school_id, name, is_active").eq("school_id", profile.school_id).eq("is_active", true).maybeSingle(),
        ]);
        for (const response of [teachersResponse, usersResponse, cyclesResponse, subjectsResponse, classesResponse, levelsResponse, seriesResponse, academicYearResponse]) if (response.error) throw response.error;
        const activeYear = academicYearResponse.data ?? null;
        setTeachers(teachersResponse.data ?? []); setUsers(usersResponse.data ?? []); setCycles(cyclesResponse.data ?? []); setSubjects(subjectsResponse.data ?? []);
        setClasses((classesResponse.data ?? []).filter((item) => !activeYear || item.academic_year_id === activeYear.id));
        setLevels(levelsResponse.data ?? []); setSeries(seriesResponse.data ?? []); setAcademicYear(activeYear);
        if (!activeYear) { setClassSubjects([]); setTeacherAssignments([]); return; }

        const [classSubjectsResponse, assignments] = await Promise.all([
          supabase.from("class_subjects").select("id, class_id, subject_id, academic_year_id, coefficient").eq("school_id", profile.school_id).eq("academic_year_id", activeYear.id),
          loadTeacherAssignmentsForAcademicYear(activeYear.id, profile.school_id),
        ]);
        if (classSubjectsResponse.error) throw classSubjectsResponse.error;
        setClassSubjects((classSubjectsResponse.data ?? []) as ClassSubject[]);
        setTeacherAssignments(assignments);
      } catch (error) {
        console.error("ERREUR CHARGEMENT ENSEIGNANTS :", error);
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les enseignants.");
      } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const teacherViews = useMemo<TeacherView[]>(() => {
    const classSubjectById = new Map(classSubjects.map((item) => [item.id, item]));
    const classById = new Map(classes.map((item) => [item.id, item]));
    const subjectById = new Map(subjects.map((item) => [item.id, item]));
    const cycleById = new Map(cycles.map((item) => [item.id, item]));
    const seriesById = new Map(series.map((item) => [item.id, item]));
    return teachers.map((teacher) => {
      const user = users.find((item) => item.id === teacher.user_id) ?? null;
      const primaryClasses = classes.filter((schoolClass) => schoolClass.principal_teacher_id === teacher.id);
      const assignments = teacherAssignments.filter((item) => item.teacher_id === teacher.id && item.status === "active").map((assignment) => {
        const classSubject = classSubjectById.get(assignment.class_subject_id);
        if (!classSubject) return null;
        const schoolClass = classById.get(classSubject.class_id) ?? null;
        return { assignment, classSubject, subject: subjectById.get(classSubject.subject_id) ?? null, schoolClass, cycle: cycleById.get(schoolClass?.cycle_id ?? "") ?? null };
      }).filter((item): item is AssignmentView => item !== null);
      const lyceeGeneralSubjects: Subject[] = []; const lyceeTechniqueSubjects: Subject[] = [];
      assignments.filter((item) => item.cycle?.name?.toLowerCase().includes("lycée")).forEach((item) => {
        if (!item.subject) return;
        const schoolSeries = item.schoolClass?.series_id ? seriesById.get(item.schoolClass.series_id) : null;
        const text = `${schoolSeries?.name ?? ""} ${schoolSeries?.category ?? ""}`.toLowerCase();
        const technical = text.includes("technique") || text.includes("industri") || text.includes("scientifique") || text.includes("série e") || text.includes("série f");
        const target = technical ? lyceeTechniqueSubjects : lyceeGeneralSubjects;
        if (!target.some((subject) => subject.id === item.subject!.id)) target.push(item.subject);
      });
      return { teacher, user, primaryClasses, assignments, lyceeGeneralSubjects, lyceeTechniqueSubjects };
    });
  }, [teachers, users, cycles, subjects, classes, series, classSubjects, teacherAssignments]);

  const filteredTeachers = useMemo(() => {
    const query = search.toLowerCase().trim();
    return teacherViews.filter((item) => {
      const fullName = `${item.user?.first_name ?? ""} ${item.user?.last_name ?? ""}`.toLowerCase();
      const email = item.user?.email?.toLowerCase() ?? ""; const matricule = item.teacher.employee_number?.toLowerCase() ?? "";
      if (query && !fullName.includes(query) && !email.includes(query) && !matricule.includes(query)) return false;
      if (cycleFilter === "Tous") return true;
      if (cycleFilter === "Primaire") return item.primaryClasses.some((schoolClass) => cycles.find((cycle) => cycle.id === schoolClass.cycle_id)?.name?.toLowerCase().includes("primaire"));
      return item.assignments.some((assignment) => assignment.cycle?.name?.toLowerCase().includes(cycleFilter.toLowerCase()));
    });
  }, [teacherViews, search, cycleFilter, cycles]);

  const counts = useMemo(() => {
    let primaire = 0, college = 0, lycee = 0;
    teacherViews.forEach((teacher) => {
      if (teacher.primaryClasses.some((schoolClass) => cycles.find((cycle) => cycle.id === schoolClass.cycle_id)?.name?.toLowerCase().includes("primaire"))) primaire++;
      if (teacher.assignments.some((assignment) => assignment.cycle?.name?.toLowerCase().includes("collège"))) college++;
      if (teacher.assignments.some((assignment) => assignment.cycle?.name?.toLowerCase().includes("lycée"))) lycee++;
    });
    return { total: teacherViews.length, primaire, college, lycee };
  }, [teacherViews, cycles]);

  const resetTeacherForm = () => { setTeacherFirstName(""); setTeacherLastName(""); setTeacherEmail(""); setTeacherPhone(""); setTeacherEmployeeNumber(""); setErrorMessage(""); };

  const handleCreateTeacher = async () => {
    if (!teacherFirstName.trim() || !teacherLastName.trim() || !teacherEmail.trim() || !teacherPhone.trim() || !teacherEmployeeNumber.trim()) { setErrorMessage("Veuillez compléter tous les champs obligatoires."); return; }
    if (!schoolId) { setErrorMessage("Impossible de déterminer l'école."); return; }
    setCreatingTeacher(true); setErrorMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
      const response = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ first_name: teacherFirstName.trim(), last_name: teacherLastName.trim(), email: teacherEmail.trim(), phone: teacherPhone.trim(), employee_number: teacherEmployeeNumber.trim() }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? "Impossible de créer l'enseignant.");
      setShowTeacherModal(false); resetTeacherForm(); window.location.reload();
    } catch (error) { console.error("ERREUR CRÉATION ENSEIGNANT :", error); setErrorMessage(error instanceof Error ? error.message : "Impossible de créer l'enseignant."); }
    finally { setCreatingTeacher(false); }
  };

  if (loading) return <main className="min-h-screen bg-[#F7F8FC] flex"><Sidebar userProfile={{ first_name: "Directeur" }} userRole="Directeur" /><section className="ml-[270px] flex-1 flex items-center justify-center"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C2BD9] text-white"><GraduationCap size={24} /></div><p className="mt-4 text-sm text-gray-500">Chargement des enseignants...</p></div></section></main>;

  return <main className="min-h-screen bg-[#F7F8FC]">
    <Sidebar userProfile={{ first_name: "Directeur" }} userRole="Directeur" />
    <section className="ml-[270px] min-h-screen">
      <header className="flex h-[82px] items-center justify-between border-b border-gray-100 bg-white px-8"><div><p className="text-sm text-gray-400">Gestion pédagogique</p><h1 className="mt-1 text-xl font-bold text-gray-900">Tous les enseignants</h1></div><button type="button" onClick={() => { resetTeacherForm(); setShowTeacherModal(true); }} className="flex items-center gap-2 rounded-xl bg-[#6C2BD9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B21B6]"><Plus size={18} />Ajouter un enseignant</button></header>
      <div className="p-8">
        <div className="mb-7"><h2 className="text-2xl font-bold text-gray-900">Enseignants</h2><p className="mt-1 text-sm text-gray-500">Gérez les enseignants et leurs affectations pédagogiques.</p></div>
        <div className="grid grid-cols-4 gap-5"><StatCard label="Total enseignants" value={counts.total} icon={UsersRound} /><StatCard label="Primaire" value={counts.primaire} icon={BookOpen} /><StatCard label="Collège" value={counts.college} icon={GraduationCap} /><StatCard label="Lycée" value={counts.lycee} icon={Activity} /></div>
        <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom, email ou matricule..." className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100" /></div><div className="flex rounded-xl bg-gray-100 p-1">{["Tous", "Primaire", "Collège", "Lycée"].map((filter) => <button key={filter} type="button" onClick={() => setCycleFilter(filter as typeof cycleFilter)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${cycleFilter === filter ? "bg-white text-[#6C2BD9] shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>{filter}</button>)}</div></div></div>
        {errorMessage && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>}
        {!academicYear && <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">Aucune année scolaire active n'est configurée.</div>}
        <div className="mt-7 space-y-4">{filteredTeachers.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center"><UsersRound size={42} className="mx-auto text-gray-300" /><h3 className="mt-4 text-lg font-semibold text-gray-800">Aucun enseignant trouvé</h3><p className="mt-1 text-sm text-gray-400">Aucun enseignant ne correspond aux critères sélectionnés.</p></div> : filteredTeachers.map((item) => <TeacherCard key={item.teacher.id} item={item} cycles={cycles} levels={levels} series={series} />)}</div>
      </div>
    </section>
    {showTeacherModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6"><div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-gray-100 px-6 py-5"><div><h3 className="text-lg font-bold text-gray-900">Ajouter un enseignant</h3><p className="mt-1 text-sm text-gray-400">Créez le profil d'un nouvel enseignant.</p></div><button type="button" onClick={() => { setShowTeacherModal(false); resetTeacherForm(); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button></div><div className="max-h-[75vh] overflow-y-auto p-6"><div className="grid grid-cols-2 gap-4"><FormField label="Prénom" value={teacherFirstName} onChange={setTeacherFirstName} placeholder="Ex. Jean" /><FormField label="Nom" value={teacherLastName} onChange={setTeacherLastName} placeholder="Ex. Dupont" /><FormField label="Email" type="email" value={teacherEmail} onChange={setTeacherEmail} placeholder="Ex. jean@email.com" /><FormField label="Téléphone" value={teacherPhone} onChange={setTeacherPhone} placeholder="Ex. +242 06..." /><div className="col-span-2"><FormField label="Numéro matricule" value={teacherEmployeeNumber} onChange={setTeacherEmployeeNumber} placeholder="Ex. ENS-2026-001" /></div></div><div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5"><button type="button" onClick={() => { setShowTeacherModal(false); resetTeacherForm(); }} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button><button type="button" disabled={creatingTeacher} onClick={handleCreateTeacher} className="rounded-xl bg-[#6C2BD9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-60">{creatingTeacher ? "Création..." : "Créer l'enseignant"}</button></div></div></div></div>}
  </main>;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UsersRound }) { return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-400">{label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#6C2BD9]"><Icon size={20} /></div></div></div>; }
function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <div><label className="block text-sm font-medium text-gray-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6C2BD9] focus:ring-2 focus:ring-purple-100" /></div>; }

function TeacherCard({ item, cycles, levels, series }: { item: TeacherView; cycles: Cycle[]; levels: Level[]; series: Series[] }) {
  const [expanded, setExpanded] = useState(false);
  const fullName = `${item.user?.first_name ?? ""} ${item.user?.last_name ?? ""}`.trim() || "Enseignant";
  const primaryCycleClasses = item.primaryClasses.filter((schoolClass) => cycles.find((cycle) => cycle.id === schoolClass.cycle_id)?.name?.toLowerCase().includes("primaire"));
  const assignmentsByCycle = new Map<string, { cycle: Cycle; assignments: AssignmentView[] }>();
  item.assignments.forEach((assignment) => { if (!assignment.cycle || !assignment.subject || !assignment.schoolClass) return; const key = assignment.cycle.id; if (!assignmentsByCycle.has(key)) assignmentsByCycle.set(key, { cycle: assignment.cycle, assignments: [] }); assignmentsByCycle.get(key)!.assignments.push(assignment); });

  return <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex items-center gap-5 p-5"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#6C2BD9]"><UserRound size={24} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-3"><h3 className="truncate text-base font-bold text-gray-900">{fullName}</h3>{item.teacher.employee_number && <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500">{item.teacher.employee_number}</span>}</div><div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">{item.user?.email && <span className="flex items-center gap-1.5"><Mail size={13} />{item.user.email}</span>}{item.user?.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{item.user.phone}</span>}</div></div><div className="hidden min-w-[320px] md:block"><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{primaryCycleClasses.length ? "Primaire" : "Affectations"}</p><div className="mt-1 flex flex-wrap gap-1.5">{primaryCycleClasses.length ? primaryCycleClasses.slice(0, 3).map((schoolClass) => <span key={schoolClass.id} className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-[#6C2BD9]">{schoolClass.name}</span>) : item.assignments.slice(0, 3).map((assignment) => <span key={assignment.assignment.id} className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-[#6C2BD9]">{assignment.subject?.name ?? "Matière"}</span>)}</div></div><button type="button" onClick={() => setExpanded((value) => !value)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><ChevronDown size={19} className={expanded ? "rotate-180 transition-transform" : "transition-transform"} /></button></div>
    {expanded && <div className="border-t border-gray-100 bg-gray-50/70 p-5">{primaryCycleClasses.length > 0 && <div><div className="flex items-center gap-2"><BookOpen size={17} className="text-[#6C2BD9]" /><h4 className="text-sm font-bold text-gray-900">Primaire</h4></div><div className="mt-3 flex flex-wrap gap-2">{primaryCycleClasses.map((schoolClass) => { const level = levels.find((item) => item.id === schoolClass.level_id); return <div key={schoolClass.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3"><p className="text-sm font-semibold text-gray-800">{schoolClass.name}</p>{level && <p className="mt-1 text-xs text-gray-400">{level.name}</p>}</div>; })}</div></div>}{assignmentsByCycle.size > 0 && <div className={primaryCycleClasses.length ? "mt-6" : ""}><div className="flex items-center gap-2"><GraduationCap size={17} className="text-[#6C2BD9]" /><h4 className="text-sm font-bold text-gray-900">Affectations pédagogiques</h4></div><div className="mt-3 space-y-3">{Array.from(assignmentsByCycle.values()).map((entry) => <div key={entry.cycle.id} className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{entry.cycle.name}</p><div className="mt-3 space-y-2">{entry.assignments.map((assignment) => { const schoolSeries = assignment.schoolClass?.series_id ? series.find((item) => item.id === assignment.schoolClass?.series_id) : null; const isLycee = entry.cycle.name.toLowerCase().includes("lycée"); return <div key={assignment.assignment.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-gray-800">{assignment.subject?.name}</p><p className="mt-1 text-xs text-gray-400">{assignment.schoolClass?.name}{isLycee && schoolSeries ? ` · ${schoolSeries.name}${schoolSeries.category ? ` — ${schoolSeries.category}` : ""}` : ""}</p></div>{isLycee && <span className="rounded-lg bg-purple-50 px-2 py-1 text-[10px] font-semibold text-[#6C2BD9]">Lycée</span>}</div></div>; })}</div></div>)}</div></div>}{primaryCycleClasses.length === 0 && assignmentsByCycle.size === 0 && <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center"><p className="text-sm font-medium text-gray-600">Aucune affectation pédagogique pour le moment.</p><p className="mt-1 text-xs text-gray-400">Le profil pédagogique pourra être configuré ultérieurement.</p></div>}</div>}
  </div>;
}
