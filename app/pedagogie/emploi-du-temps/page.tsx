"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  DoorOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type Role = { name: string };

type UserProfile = {
  id: string;
  auth_user_id: string | null;
  school_id: string | null;
  first_name: string | null;
  last_name: string | null;
  roles: Role | Role[] | null;
};

type SchoolDay = {
  id: string;
  school_id: string;
  day_of_week: number;
  name: string;
  short_name: string | null;
  is_school_day: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type TimeSlot = {
  id: string;
  school_id: string;
  name: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AcademicYear = {
  id: string;
  school_id: string | null;
  name: string;
  is_active: boolean | null;
};

type CalendarExceptionType =
  | "holiday"
  | "vacation"
  | "school_closed"
  | "pedagogical_day"
  | "exam_period"
  | "event"
  | "other";

type CalendarSource = "school" | "official" | "imported";

type CalendarException = {
  id: string;
  school_id: string;
  academic_year_id: string;
  title: string;
  exception_type: CalendarExceptionType;
  start_date: string;
  end_date: string;
  affects_teaching: boolean;
  affects_staff: boolean;
  notes: string | null;
  source: CalendarSource;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CalendarForm = {
  id?: string;
  title: string;
  exceptionType: CalendarExceptionType;
  startDate: string;
  endDate: string;
  affectsTeaching: boolean;
  affectsStaff: boolean;
  notes: string;
  source: CalendarSource;
  isActive: boolean;
};

type Teacher = {
  id: string;
  school_id: string | null;
  user_id: string | null;
  employee_number: string | null;
};

type TeacherUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  is_active: boolean | null;
};

type AvailabilityStatus =
  | "available"
  | "unavailable"
  | "preferred"
  | "avoid";

type AvailabilitySource =
  | "teacher"
  | "administration";

type TeacherAvailability = {
  id: string;
  school_id: string;
  teacher_id: string;
  academic_year_id: string;
  school_day_id: string;
  time_slot_id: string;
  availability_status: AvailabilityStatus;
  reason: string | null;
  source: AvailabilitySource;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
};

type TeacherAvailabilitySummary = {
  teacher: Teacher;
  user: TeacherUser | null;
  name: string;
  email: string;
  employeeNumber: string;
  entries: TeacherAvailability[];
  completedSlots: number;
  totalSlots: number;
  completionRate: number;
};

type Room = {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  room_type: string;
  capacity: number | null;
  is_active: boolean;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type RoomForm = {
  id?: string;
  name: string;
  code: string;
  capacity: string;
  isActive: boolean;
};

type SchoolClass = {
  id: string; school_id: string | null; cycle_id: string | null; academic_year_id: string | null;
  name: string; level_id: string | null; series_id: string | null; status: string;
};
type Subject = { id: string; school_id: string; name: string; code: string | null; is_active: boolean; };
type ClassSubject = { id: string; class_id: string; subject_id: string; academic_year_id: string; coefficient: number; school_id: string; hours_per_week: number | null; is_active: boolean; };
type TeacherAssignment = { id: string; school_id: string; teacher_id: string; class_subject_id: string; academic_year_id: string; status: string; is_primary_teacher: boolean; };
type Timetable = { id: string; school_id: string; academic_year_id: string; name: string; version: number; status: string; source: string; valid_from: string | null; valid_until: string | null; created_by: string | null; validated_by: string | null; validated_at: string | null; published_at: string | null; created_at: string; updated_at: string; };
type TimetableEntry = { id: string; school_id: string; timetable_id: string; class_id: string; class_subject_id: string | null; teacher_assignment_id: string | null; room_id: string | null; school_day_id: string; time_slot_id: string; entry_type: string; notes: string | null; is_locked: boolean; created_at: string; updated_at: string; };
type EntryForm = { id?: string; schoolDayId: string; timeSlotId: string; classSubjectId: string; roomId: string; notes: string; };

type TimetableTab =
  | "timetables"
  | "configuration"
  | "calendar"
  | "availability"
  | "rooms";

type DayForm = {
  id?: string;
  dayOfWeek: string;
  name: string;
  shortName: string;
  isSchoolDay: boolean;
  displayOrder: string;
};

type SlotForm = {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  displayOrder: string;
  isActive: boolean;
};

const WEEK_DAYS = [
  { value: 1, name: "Lundi", short: "Lun." },
  { value: 2, name: "Mardi", short: "Mar." },
  { value: 3, name: "Mercredi", short: "Mer." },
  { value: 4, name: "Jeudi", short: "Jeu." },
  { value: 5, name: "Vendredi", short: "Ven." },
  { value: 6, name: "Samedi", short: "Sam." },
  { value: 7, name: "Dimanche", short: "Dim." },
];

const EMPTY_DAY_FORM: DayForm = {
  dayOfWeek: "1",
  name: "Lundi",
  shortName: "Lun.",
  isSchoolDay: true,
  displayOrder: "1",
};

const EMPTY_SLOT_FORM: SlotForm = {
  name: "",
  startTime: "",
  endTime: "",
  displayOrder: "1",
  isActive: true,
};

const EMPTY_CALENDAR_FORM: CalendarForm = {
  title: "",
  exceptionType: "holiday",
  startDate: "",
  endDate: "",
  affectsTeaching: true,
  affectsStaff: false,
  notes: "",
  source: "school",
  isActive: true,
};

const EMPTY_ROOM_FORM: RoomForm = {
  name: "",
  code: "",
  capacity: "",
  isActive: true,
};

const EMPTY_ENTRY_FORM: EntryForm = { schoolDayId: "", timeSlotId: "", classSubjectId: "", roomId: "", notes: "" };

const CALENDAR_TYPE_LABELS: Record<CalendarExceptionType, string> = {
  holiday: "Jour férié",
  vacation: "Vacances",
  school_closed: "Fermeture",
  pedagogical_day: "Journée pédagogique",
  exam_period: "Période d'examens",
  event: "Événement",
  other: "Autre",
};

const CALENDAR_SOURCE_LABELS: Record<CalendarSource, string> = {
  school: "Établissement",
  official: "Officiel",
  imported: "Importé",
};

const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Disponible",
  unavailable: "Indisponible",
  preferred: "Préféré",
  avoid: "À éviter",
};

const AVAILABILITY_SOURCE_LABELS: Record<AvailabilitySource, string> = {
  teacher: "Enseignant",
  administration: "Administration",
};

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50";

const TABS = [
  { id: "timetables" as TimetableTab, label: "Emplois du temps", icon: CalendarDays },
  { id: "configuration" as TimetableTab, label: "Configuration horaire", icon: Settings2 },
  { id: "calendar" as TimetableTab, label: "Calendrier scolaire", icon: CalendarDays },
  { id: "availability" as TimetableTab, label: "Disponibilités", icon: UsersRound },
  { id: "rooms" as TimetableTab, label: "Salles", icon: DoorOpen },
];

function getRole(profile: UserProfile | null) {
  if (!profile?.roles) return "";
  return Array.isArray(profile.roles)
    ? profile.roles[0]?.name ?? ""
    : profile.roles.name ?? "";
}

function shortTime(value: string) {
  return value ? value.slice(0, 5) : "—";
}

function formatTeacherName(
  teacher: Teacher,
  user: TeacherUser | null
) {
  const fullName = `${user?.first_name ?? ""} ${
    user?.last_name ?? ""
  }`.trim();

  return (
    fullName ||
    user?.email ||
    teacher.employee_number ||
    "Enseignant"
  );
}

export default function TimetablePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [schoolDays, setSchoolDays] = useState<SchoolDay[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [calendarExceptions, setCalendarExceptions] =
    useState<CalendarException[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherUsers, setTeacherUsers] = useState<TeacherUser[]>([]);
  const [teacherAvailability, setTeacherAvailability] =
    useState<TeacherAvailability[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [availabilitySearch, setAvailabilitySearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const [activeTab, setActiveTab] =
    useState<TimetableTab>("timetables");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayForm, setDayForm] = useState<DayForm>(EMPTY_DAY_FORM);

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState<SlotForm>(EMPTY_SLOT_FORM);

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarForm, setCalendarForm] =
    useState<CalendarForm>(EMPTY_CALENDAR_FORM);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomForm, setRoomForm] =
    useState<RoomForm>(EMPTY_ROOM_FORM);
  const [roomSearch, setRoomSearch] = useState("");
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryForm>(EMPTY_ENTRY_FORM);

  const schoolId = profile?.school_id ?? "";
  const userRole = getRole(profile);
  const canManage = userRole === "Directeur";

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setNotice(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté.");

      const { data: profileData, error: profileError } =
        await supabase
          .from("users")
          .select(
            "id, auth_user_id, school_id, first_name, last_name, roles(name)"
          )
          .eq("auth_user_id", user.id)
          .single();

      if (profileError) throw profileError;
      if (!profileData?.school_id) {
        throw new Error(
          "Aucun établissement n'est associé à cet utilisateur."
        );
      }

      const sid = profileData.school_id;
      setProfile(profileData as unknown as UserProfile);

      const [
        daysResult,
        slotsResult,
        yearsResult,
        calendarResult,
        teachersResult,
        availabilityResult,
        roomsResult,
        classesResult,
        subjectsResult,
        classSubjectsResult,
        assignmentsResult,
        timetablesResult,
        entriesResult,
      ] = await Promise.all([
        supabase
          .from("school_days")
          .select(
            "id, school_id, day_of_week, name, short_name, is_school_day, display_order, created_at, updated_at"
          )
          .eq("school_id", sid)
          .order("display_order")
          .order("day_of_week"),

        supabase
          .from("time_slots")
          .select(
            "id, school_id, name, start_time, end_time, slot_type, display_order, is_active, created_at, updated_at"
          )
          .eq("school_id", sid)
          .order("display_order")
          .order("start_time"),

        supabase
          .from("academic_years")
          .select("id, school_id, name, is_active")
          .eq("school_id", sid),

        supabase
          .from("school_calendar_exceptions")
          .select(
            "id, school_id, academic_year_id, title, exception_type, start_date, end_date, affects_teaching, affects_staff, notes, source, is_active, created_by, created_at, updated_at"
          )
          .eq("school_id", sid)
          .order("start_date"),

        supabase
          .from("teachers")
          .select("id, school_id, user_id, employee_number")
          .eq("school_id", sid),

        supabase
          .from("teacher_availability")
          .select(
            "id, school_id, teacher_id, academic_year_id, school_day_id, time_slot_id, availability_status, reason, source, is_locked, created_at, updated_at"
          )
          .eq("school_id", sid),

        supabase
          .from("rooms")
          .select("id, school_id, name, code, room_type, capacity, is_active, configuration, created_at, updated_at")
          .eq("school_id", sid).order("name"),
        supabase.from("classes").select("id, school_id, cycle_id, academic_year_id, name, level_id, series_id, status").eq("school_id", sid).order("name"),
        supabase.from("subjects").select("id, school_id, name, code, is_active").eq("school_id", sid).eq("is_active", true).order("name"),
        supabase.from("class_subjects").select("id, class_id, subject_id, academic_year_id, coefficient, school_id, hours_per_week, is_active").eq("school_id", sid).eq("is_active", true),
        supabase.from("teacher_assignments").select("id, school_id, teacher_id, class_subject_id, academic_year_id, status, is_primary_teacher").eq("school_id", sid).eq("status", "active"),
        supabase.from("timetables").select("id, school_id, academic_year_id, name, version, status, source, valid_from, valid_until, created_by, validated_by, validated_at, published_at, created_at, updated_at").eq("school_id", sid).order("created_at", { ascending: false }),
        supabase.from("timetable_entries").select("id, school_id, timetable_id, class_id, class_subject_id, teacher_assignment_id, room_id, school_day_id, time_slot_id, entry_type, notes, is_locked, created_at, updated_at").eq("school_id", sid),
      ]);

      if (daysResult.error) throw daysResult.error;
      if (slotsResult.error) throw slotsResult.error;
      if (yearsResult.error) throw yearsResult.error;
      if (calendarResult.error) throw calendarResult.error;
      if (teachersResult.error) throw teachersResult.error;
      if (availabilityResult.error) throw availabilityResult.error;
      if (roomsResult.error) throw roomsResult.error;
      if (classesResult.error) throw classesResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      if (classSubjectsResult.error) throw classSubjectsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (timetablesResult.error) throw timetablesResult.error;
      if (entriesResult.error) throw entriesResult.error;

      const loadedYears = (yearsResult.data ?? []) as AcademicYear[];
      const loadedTeachers = (teachersResult.data ?? []) as Teacher[];

      setSchoolDays((daysResult.data ?? []) as SchoolDay[]);
      setTimeSlots((slotsResult.data ?? []) as TimeSlot[]);
      setYears(loadedYears);
      setCalendarExceptions(
        (calendarResult.data ?? []) as CalendarException[]
      );
      setTeachers(loadedTeachers);
      setTeacherAvailability(
        (availabilityResult.data ?? []) as TeacherAvailability[]
      );

      setRooms((roomsResult.data ?? []) as Room[]);
      const loadedClasses = (classesResult.data ?? []) as SchoolClass[];
      const loadedTimetables = (timetablesResult.data ?? []) as Timetable[];
      setClasses(loadedClasses);
      setSubjects((subjectsResult.data ?? []) as Subject[]);
      setClassSubjects((classSubjectsResult.data ?? []) as ClassSubject[]);
      setTeacherAssignments((assignmentsResult.data ?? []) as TeacherAssignment[]);
      setTimetables(loadedTimetables);
      setTimetableEntries((entriesResult.data ?? []) as TimetableEntry[]);

      const activeYear = loadedYears.find(
        (year) => year.is_active === true
      );

      const initialYearId =
        activeYear?.id ||
        loadedYears[0]?.id ||
        "";

      setSelectedYearId(
        (current) =>
          current ||
          initialYearId
      );

      setSelectedTimetableId(
        (current) =>
          current ||
          loadedTimetables.find(
            (item) => item.academic_year_id === initialYearId
          )?.id ||
          ""
      );

      setSelectedClassId(
        (current) =>
          current ||
          loadedClasses.find(
            (item) => item.academic_year_id === initialYearId
          )?.id ||
          ""
      );

      const teacherUserIds = loadedTeachers
        .map((teacher) => teacher.user_id)
        .filter((id): id is string => Boolean(id));

      if (teacherUserIds.length > 0) {
        const { data: usersData, error: usersError } =
          await supabase
            .from("users")
            .select(
              "id, first_name, last_name, email, is_active"
            )
            .in("id", teacherUserIds);

        if (usersError) throw usersError;

        setTeacherUsers(
          (usersData ?? []) as TeacherUser[]
        );
      } else {
        setTeacherUsers([]);
      }
    } catch (error) {
      console.error("ERREUR EMPLOI DU TEMPS :", error);
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de charger la configuration horaire.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(
    () => ({
      schoolDays: schoolDays.filter((d) => d.is_school_day).length,
      allDays: schoolDays.length,
      activeSlots: timeSlots.filter((s) => s.is_active).length,
      allSlots: timeSlots.length,
    }),
    [schoolDays, timeSlots]
  );

  const configurationReady =
    stats.schoolDays > 0 && stats.activeSlots > 0;

  function openCreateDay() {
    const firstAvailable =
      WEEK_DAYS.find(
        (day) =>
          !schoolDays.some(
            (existing) => existing.day_of_week === day.value
          )
      ) ?? WEEK_DAYS[0];

    const nextOrder =
      schoolDays.length > 0
        ? Math.max(...schoolDays.map((d) => d.display_order)) + 1
        : 1;

    setDayForm({
      dayOfWeek: String(firstAvailable.value),
      name: firstAvailable.name,
      shortName: firstAvailable.short,
      isSchoolDay: true,
      displayOrder: String(nextOrder),
    });
    setNotice(null);
    setDayModalOpen(true);
  }

  function openEditDay(day: SchoolDay) {
    setDayForm({
      id: day.id,
      dayOfWeek: String(day.day_of_week),
      name: day.name,
      shortName: day.short_name ?? "",
      isSchoolDay: day.is_school_day,
      displayOrder: String(day.display_order),
    });
    setNotice(null);
    setDayModalOpen(true);
  }

  function changeWeekDay(value: string) {
    const selected = WEEK_DAYS.find(
      (day) => day.value === Number(value)
    );

    setDayForm((previous) => ({
      ...previous,
      dayOfWeek: value,
      name: selected?.name ?? previous.name,
      shortName: selected?.short ?? previous.shortName,
    }));
  }

  async function saveDay() {
    if (!schoolId) return;

    const dayOfWeek = Number(dayForm.dayOfWeek);
    const displayOrder = Number(dayForm.displayOrder);

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 7
    ) {
      setNotice({
        type: "error",
        text: "Le jour doit être compris entre 1 et 7.",
      });
      return;
    }

    if (!dayForm.name.trim()) {
      setNotice({
        type: "error",
        text: "Le nom du jour est obligatoire.",
      });
      return;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      setNotice({
        type: "error",
        text: "L'ordre d'affichage doit être supérieur à 0.",
      });
      return;
    }

    if (
      schoolDays.some(
        (day) =>
          day.day_of_week === dayOfWeek && day.id !== dayForm.id
      )
    ) {
      setNotice({
        type: "error",
        text: "Ce jour existe déjà dans la configuration.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        school_id: schoolId,
        day_of_week: dayOfWeek,
        name: dayForm.name.trim(),
        short_name: dayForm.shortName.trim() || null,
        is_school_day: dayForm.isSchoolDay,
        display_order: displayOrder,
      };

      if (dayForm.id) {
        const { data, error } = await supabase
          .from("school_days")
          .update(payload)
          .eq("id", dayForm.id)
          .eq("school_id", schoolId)
          .select(
            "id, school_id, day_of_week, name, short_name, is_school_day, display_order, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setSchoolDays((previous) =>
          previous
            .map((item) =>
              item.id === dayForm.id ? (data as SchoolDay) : item
            )
            .sort((a, b) => a.display_order - b.display_order)
        );

        setNotice({
          type: "success",
          text: "Jour scolaire mis à jour.",
        });
      } else {
        const { data, error } = await supabase
          .from("school_days")
          .insert(payload)
          .select(
            "id, school_id, day_of_week, name, short_name, is_school_day, display_order, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setSchoolDays((previous) =>
          [...previous, data as SchoolDay].sort(
            (a, b) => a.display_order - b.display_order
          )
        );

        setNotice({
          type: "success",
          text: "Jour scolaire ajouté.",
        });
      }

      setDayModalOpen(false);
      setDayForm(EMPTY_DAY_FORM);
    } catch (error) {
      console.error("ERREUR JOUR :", error);
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer ce jour.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleDay(day: SchoolDay) {
    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("school_days")
        .update({ is_school_day: !day.is_school_day })
        .eq("id", day.id)
        .eq("school_id", schoolId)
        .select(
          "id, school_id, day_of_week, name, short_name, is_school_day, display_order, created_at, updated_at"
        )
        .single();

      if (error) throw error;

      setSchoolDays((previous) =>
        previous.map((item) =>
          item.id === day.id ? (data as SchoolDay) : item
        )
      );

      setNotice({
        type: "success",
        text: data.is_school_day
          ? `${data.name} est maintenant actif.`
          : `${data.name} est maintenant inactif.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier ce jour.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteDay(day: SchoolDay) {
    if (!window.confirm(`Supprimer « ${day.name} » ?`)) return;

    setDeletingId(day.id);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("school_days")
        .delete()
        .eq("id", day.id)
        .eq("school_id", schoolId);

      if (error) throw error;

      setSchoolDays((previous) =>
        previous.filter((item) => item.id !== day.id)
      );

      setNotice({
        type: "success",
        text: "Jour supprimé.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer ce jour.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  function openCreateSlot() {
    const nextOrder =
      timeSlots.length > 0
        ? Math.max(...timeSlots.map((slot) => slot.display_order)) + 1
        : 1;

    setSlotForm({
      ...EMPTY_SLOT_FORM,
      displayOrder: String(nextOrder),
    });

    setNotice(null);
    setSlotModalOpen(true);
  }

  function openEditSlot(slot: TimeSlot) {
    setSlotForm({
      id: slot.id,
      name: slot.name,
      startTime: shortTime(slot.start_time),
      endTime: shortTime(slot.end_time),
      displayOrder: String(slot.display_order),
      isActive: slot.is_active,
    });

    setNotice(null);
    setSlotModalOpen(true);
  }

  async function saveSlot() {
    if (!schoolId) {
  setNotice({
    type: "error",
    text: "Aucune école sélectionnée. schoolId est vide.",
  });
  return;
}

    const displayOrder = Number(slotForm.displayOrder);

    if (!slotForm.name.trim()) {
      setNotice({
        type: "error",
        text: "Le nom du créneau est obligatoire.",
      });
      return;
    }

    if (!slotForm.startTime || !slotForm.endTime) {
      setNotice({
        type: "error",
        text: "Les heures de début et de fin sont obligatoires.",
      });
      return;
    }

    if (slotForm.startTime >= slotForm.endTime) {
      setNotice({
        type: "error",
        text: "L'heure de fin doit être postérieure à l'heure de début.",
      });
      return;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      setNotice({
        type: "error",
        text: "L'ordre d'affichage doit être supérieur à 0.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        school_id: schoolId,
        name: slotForm.name.trim(),
        start_time: slotForm.startTime,
        end_time: slotForm.endTime,
        slot_type: "course",
        display_order: displayOrder,
        is_active: slotForm.isActive,
      };

      if (slotForm.id) {
        const { data, error } = await supabase
          .from("time_slots")
          .update(payload)
          .eq("id", slotForm.id)
          .eq("school_id", schoolId)
          .select(
            "id, school_id, name, start_time, end_time, slot_type, display_order, is_active, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setTimeSlots((previous) =>
          previous
            .map((item) =>
              item.id === slotForm.id ? (data as TimeSlot) : item
            )
            .sort((a, b) => a.display_order - b.display_order)
        );

        setNotice({
          type: "success",
          text: "Créneau mis à jour.",
        });
      } else {
        const { data, error } = await supabase
          .from("time_slots")
          .insert(payload)
          .select(
            "id, school_id, name, start_time, end_time, slot_type, display_order, is_active, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setTimeSlots((previous) =>
          [...previous, data as TimeSlot].sort(
            (a, b) => a.display_order - b.display_order
          )
        );

        setNotice({
          type: "success",
          text: "Créneau ajouté.",
        });
      }

      setSlotModalOpen(false);
      setSlotForm(EMPTY_SLOT_FORM);
    } catch (error) {
      console.error("ERREUR CRÉNEAU :", error);
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer ce créneau.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleSlot(slot: TimeSlot) {
    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("time_slots")
        .update({ is_active: !slot.is_active })
        .eq("id", slot.id)
        .eq("school_id", schoolId)
        .select(
          "id, school_id, name, start_time, end_time, slot_type, display_order, is_active, created_at, updated_at"
        )
        .single();

      if (error) throw error;

      setTimeSlots((previous) =>
        previous.map((item) =>
          item.id === slot.id ? (data as TimeSlot) : item
        )
      );

      setNotice({
        type: "success",
        text: data.is_active
          ? `${data.name} est maintenant actif.`
          : `${data.name} est maintenant inactif.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier ce créneau.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot(slot: TimeSlot) {
    if (!window.confirm(`Supprimer « ${slot.name} » ?`)) return;

    setDeletingId(slot.id);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("id", slot.id)
        .eq("school_id", schoolId);

      if (error) throw error;

      setTimeSlots((previous) =>
        previous.filter((item) => item.id !== slot.id)
      );

      setNotice({
        type: "success",
        text: "Créneau supprimé.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer ce créneau.",
      });
    } finally {
      setDeletingId(null);
    }
  }



  const activeSchoolDays = useMemo(
    () =>
      schoolDays
        .filter((day) => day.is_school_day)
        .sort((a, b) => a.display_order - b.display_order),
    [schoolDays]
  );

  const activeTimeSlots = useMemo(
    () =>
      timeSlots
        .filter((slot) => slot.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    [timeSlots]
  );

  const availabilitySummaries =
    useMemo<TeacherAvailabilitySummary[]>(() => {
      const totalSlots =
        activeSchoolDays.length *
        activeTimeSlots.length;

      return teachers
        .map((teacher) => {
          const user =
            teacherUsers.find(
              (item) => item.id === teacher.user_id
            ) ?? null;

          const entries =
            teacherAvailability.filter(
              (item) =>
                item.teacher_id === teacher.id &&
                item.academic_year_id === selectedYearId
            );

          const completedSlots = new Set(
            entries.map(
              (item) =>
                `${item.school_day_id}:${item.time_slot_id}`
            )
          ).size;

          return {
            teacher,
            user,
            name: formatTeacherName(teacher, user),
            email: user?.email ?? "",
            employeeNumber:
              teacher.employee_number ?? "",
            entries,
            completedSlots,
            totalSlots,
            completionRate:
              totalSlots > 0
                ? Math.round(
                    (completedSlots / totalSlots) * 100
                  )
                : 0,
          };
        })
        .sort((a, b) =>
          a.name.localeCompare(b.name, "fr")
        );
    }, [
      teachers,
      teacherUsers,
      teacherAvailability,
      selectedYearId,
      activeSchoolDays,
      activeTimeSlots,
    ]);

  const filteredAvailabilitySummaries = useMemo(() => {
    const query = availabilitySearch
      .trim()
      .toLowerCase();

    if (!query) {
      return availabilitySummaries;
    }

    return availabilitySummaries.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.employeeNumber.toLowerCase().includes(query)
    );
  }, [availabilitySummaries, availabilitySearch]);

  const selectedAvailabilityTeacher =
    availabilitySummaries.find(
      (item) => item.teacher.id === selectedTeacherId
    ) ?? null;

  const availabilityStats = useMemo(() => {
    const total = availabilitySummaries.length;

    const completed =
      availabilitySummaries.filter(
        (item) =>
          item.totalSlots > 0 &&
          item.completedSlots >= item.totalSlots
      ).length;

    const started =
      availabilitySummaries.filter(
        (item) =>
          item.completedSlots > 0 &&
          item.completedSlots < item.totalSlots
      ).length;

    const notStarted =
      availabilitySummaries.filter(
        (item) => item.completedSlots === 0
      ).length;

    return {
      total,
      completed,
      started,
      notStarted,
    };
  }, [availabilitySummaries]);

  const filteredCalendarExceptions = useMemo(
    () =>
      calendarExceptions
        .filter(
          (item) =>
            !selectedYearId ||
            item.academic_year_id === selectedYearId
        )
        .sort((a, b) =>
          a.start_date.localeCompare(b.start_date)
        ),
    [calendarExceptions, selectedYearId]
  );

  const currentYear =
    years.find((year) => year.id === selectedYearId) ?? null;

  function openCreateCalendarException() {
    setCalendarForm(EMPTY_CALENDAR_FORM);
    setNotice(null);
    setCalendarModalOpen(true);
  }

  function openEditCalendarException(item: CalendarException) {
    setCalendarForm({
      id: item.id,
      title: item.title,
      exceptionType: item.exception_type,
      startDate: item.start_date,
      endDate: item.end_date,
      affectsTeaching: item.affects_teaching,
      affectsStaff: item.affects_staff,
      notes: item.notes ?? "",
      source: item.source,
      isActive: item.is_active,
    });
    setNotice(null);
    setCalendarModalOpen(true);
  }

  async function saveCalendarException() {
    if (!schoolId || !selectedYearId) return;

    if (!calendarForm.title.trim()) {
      setNotice({
        type: "error",
        text: "Le titre est obligatoire.",
      });
      return;
    }

    if (!calendarForm.startDate || !calendarForm.endDate) {
      setNotice({
        type: "error",
        text: "Les dates de début et de fin sont obligatoires.",
      });
      return;
    }

    if (calendarForm.endDate < calendarForm.startDate) {
      setNotice({
        type: "error",
        text: "La date de fin doit être postérieure ou égale à la date de début.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        school_id: schoolId,
        academic_year_id: selectedYearId,
        title: calendarForm.title.trim(),
        exception_type: calendarForm.exceptionType,
        start_date: calendarForm.startDate,
        end_date: calendarForm.endDate,
        affects_teaching: calendarForm.affectsTeaching,
        affects_staff: calendarForm.affectsStaff,
        notes: calendarForm.notes.trim() || null,
        source: calendarForm.source,
        is_active: calendarForm.isActive,
        created_by: profile?.id ?? null,
      };

      if (calendarForm.id) {
        const { data, error } = await supabase
          .from("school_calendar_exceptions")
          .update({
            title: payload.title,
            exception_type: payload.exception_type,
            start_date: payload.start_date,
            end_date: payload.end_date,
            affects_teaching: payload.affects_teaching,
            affects_staff: payload.affects_staff,
            notes: payload.notes,
            source: payload.source,
            is_active: payload.is_active,
          })
          .eq("id", calendarForm.id)
          .eq("school_id", schoolId)
          .select(
            "id, school_id, academic_year_id, title, exception_type, start_date, end_date, affects_teaching, affects_staff, notes, source, is_active, created_by, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setCalendarExceptions((previous) =>
          previous.map((item) =>
            item.id === calendarForm.id
              ? (data as CalendarException)
              : item
          )
        );

        setNotice({
          type: "success",
          text: "Événement du calendrier mis à jour.",
        });
      } else {
        const { data, error } = await supabase
          .from("school_calendar_exceptions")
          .insert(payload)
          .select(
            "id, school_id, academic_year_id, title, exception_type, start_date, end_date, affects_teaching, affects_staff, notes, source, is_active, created_by, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setCalendarExceptions((previous) => [
          ...previous,
          data as CalendarException,
        ]);

        setNotice({
          type: "success",
          text: "Événement ajouté au calendrier scolaire.",
        });
      }

      setCalendarModalOpen(false);
      setCalendarForm(EMPTY_CALENDAR_FORM);
    } catch (error) {
      console.error("ERREUR CALENDRIER SCOLAIRE :", error);

      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer cet événement.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCalendarException(item: CalendarException) {
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return;

    setDeletingId(item.id);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("school_calendar_exceptions")
        .delete()
        .eq("id", item.id)
        .eq("school_id", schoolId);

      if (error) throw error;

      setCalendarExceptions((previous) =>
        previous.filter((value) => value.id !== item.id)
      );

      setNotice({
        type: "success",
        text: "Événement supprimé du calendrier.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cet événement.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleCalendarException(item: CalendarException) {
    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("school_calendar_exceptions")
        .update({ is_active: !item.is_active })
        .eq("id", item.id)
        .eq("school_id", schoolId)
        .select(
          "id, school_id, academic_year_id, title, exception_type, start_date, end_date, affects_teaching, affects_staff, notes, source, is_active, created_by, created_at, updated_at"
        )
        .single();

      if (error) throw error;

      setCalendarExceptions((previous) =>
        previous.map((value) =>
          value.id === item.id
            ? (data as CalendarException)
            : value
        )
      );

      setNotice({
        type: "success",
        text: data.is_active
          ? "Événement activé."
          : "Événement désactivé.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier cet événement.",
      });
    } finally {
      setSaving(false);
    }
  }


  const yearClasses = useMemo(() => classes.filter((i) => !selectedYearId || i.academic_year_id === selectedYearId), [classes, selectedYearId]);
  const yearTimetables = useMemo(() => timetables.filter((i) => !selectedYearId || i.academic_year_id === selectedYearId), [timetables, selectedYearId]);
  useEffect(() => { if (!selectedTimetableId || !yearTimetables.some((i) => i.id === selectedTimetableId)) setSelectedTimetableId(yearTimetables[0]?.id ?? ""); }, [yearTimetables, selectedTimetableId]);
  useEffect(() => { if (!selectedClassId || !yearClasses.some((i) => i.id === selectedClassId)) setSelectedClassId(yearClasses[0]?.id ?? ""); }, [yearClasses, selectedClassId]);
  const selectedClass = yearClasses.find((i) => i.id === selectedClassId) ?? null;
  const selectedTimetable = yearTimetables.find((i) => i.id === selectedTimetableId) ?? null;
  const selectedClassSubjects = useMemo(() => classSubjects.filter((i) => i.class_id === selectedClassId && i.academic_year_id === selectedYearId && i.is_active), [classSubjects, selectedClassId, selectedYearId]);
  const selectedClassEntries = useMemo(() => timetableEntries.filter((i) => i.timetable_id === selectedTimetableId && i.class_id === selectedClassId), [timetableEntries, selectedTimetableId, selectedClassId]);
  function getSubjectName(id: string | null) { const cs=classSubjects.find((i)=>i.id===id); return subjects.find((s)=>s.id===cs?.subject_id)?.name ?? "Cours"; }
  function getAssignmentForClassSubject(id:string){ return teacherAssignments.find((a)=>a.class_subject_id===id && a.academic_year_id===selectedYearId && a.status==="active") ?? null; }
  function getTeacherNameFromAssignment(id:string|null){ const a=teacherAssignments.find((x)=>x.id===id); const t=teachers.find((x)=>x.id===a?.teacher_id); const u=teacherUsers.find((x)=>x.id===t?.user_id)??null; return t?formatTeacherName(t,u):"Non affecté"; }
  function getRoomName(id:string|null){ return rooms.find((r)=>r.id===id)?.name ?? ""; }
  function slotDurationHours(id:string){ const s=timeSlots.find((x)=>x.id===id); if(!s)return 0; const [sh,sm]=shortTime(s.start_time).split(":").map(Number); const [eh,em]=shortTime(s.end_time).split(":").map(Number); return Math.max(0,((eh*60+em)-(sh*60+sm))/60); }
  function plannedHoursForClassSubject(id:string){ return selectedClassEntries.filter((e)=>e.class_subject_id===id).reduce((sum,e)=>sum+slotDurationHours(e.time_slot_id),0); }
  function openCreateEntry(dayId:string, slotId:string){ setEntryForm({...EMPTY_ENTRY_FORM, schoolDayId:dayId,timeSlotId:slotId}); setNotice(null); setEntryModalOpen(true); }
  function openEditEntry(entry:TimetableEntry){ setEntryForm({id:entry.id,schoolDayId:entry.school_day_id,timeSlotId:entry.time_slot_id,classSubjectId:entry.class_subject_id??"",roomId:entry.room_id??"",notes:entry.notes??""}); setNotice(null); setEntryModalOpen(true); }
  async function createDraftTimetable() {
  if (!schoolId || !selectedYearId) {
    setNotice({
      type: "error",
      text: "Veuillez sélectionner une année scolaire.",
    });
    return;
  }

  setSaving(true);
  setNotice(null);

  try {
    const selectedYear = years.find(
      (year) => year.id === selectedYearId
    );

    const existingVersions = timetables.filter(
      (timetable) =>
        timetable.academic_year_id === selectedYearId
    );

    const nextVersion =
      existingVersions.length > 0
        ? Math.max(
            ...existingVersions.map(
              (timetable) => timetable.version ?? 1
            )
          ) + 1
        : 1;

    const { data, error } = await supabase
      .from("timetables")
      .insert({
        school_id: schoolId,
        academic_year_id: selectedYearId,
        name: `Emploi du temps ${
          selectedYear?.name ?? ""
        }`.trim(),
        version: nextVersion,
        status: "draft",
        source: "manual",
        created_by: profile?.id ?? null,
      })
      .select(
        `
        id,
        school_id,
        academic_year_id,
        name,
        version,
        status,
        source,
        valid_from,
        valid_until,
        created_by,
        validated_by,
        validated_at,
        published_at,
        created_at,
        updated_at
        `
      )
      .single();

    if (error) {
      throw error;
    }

    const newTimetable = data as Timetable;

    setTimetables((previous) => [
      newTimetable,
      ...previous,
    ]);

    // Sélectionner automatiquement le nouveau brouillon
    setSelectedTimetableId(newTimetable.id);

    setNotice({
      type: "success",
      text: `Brouillon v${newTimetable.version} créé et ouvert.`,
    });
  } catch (error) {
    console.error(
      "ERREUR CRÉATION EMPLOI DU TEMPS :",
      error
    );

    setNotice({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Impossible de créer le brouillon.",
    });
  } finally {
    setSaving(false);
  }
}
  async function saveTimetableEntry(){ if(!schoolId||!selectedTimetableId||!selectedClassId||!entryForm.schoolDayId||!entryForm.timeSlotId||!entryForm.classSubjectId)return; const assignment=getAssignmentForClassSubject(entryForm.classSubjectId); if(!assignment){setNotice({type:"error",text:"Aucun enseignant actif n'est affecté à cette matière."});return;} setSaving(true);setNotice(null); try{ const payload={school_id:schoolId,timetable_id:selectedTimetableId,class_id:selectedClassId,class_subject_id:entryForm.classSubjectId,teacher_assignment_id:assignment.id,room_id:entryForm.roomId||null,school_day_id:entryForm.schoolDayId,time_slot_id:entryForm.timeSlotId,entry_type:"course",notes:entryForm.notes.trim()||null}; if(entryForm.id){ const {data,error}=await supabase.from("timetable_entries").update(payload).eq("id",entryForm.id).eq("school_id",schoolId).select("id, school_id, timetable_id, class_id, class_subject_id, teacher_assignment_id, room_id, school_day_id, time_slot_id, entry_type, notes, is_locked, created_at, updated_at").single(); if(error)throw error; setTimetableEntries((p)=>p.map((i)=>i.id===entryForm.id?data as TimetableEntry:i)); } else { const {data,error}=await supabase.from("timetable_entries").insert(payload).select("id, school_id, timetable_id, class_id, class_subject_id, teacher_assignment_id, room_id, school_day_id, time_slot_id, entry_type, notes, is_locked, created_at, updated_at").single(); if(error)throw error; setTimetableEntries((p)=>[...p,data as TimetableEntry]); } setEntryModalOpen(false); setEntryForm(EMPTY_ENTRY_FORM); setNotice({type:"success",text:entryForm.id?"Cours mis à jour.":"Cours ajouté à l'emploi du temps."}); }catch(error){setNotice({type:"error",text:error instanceof Error?error.message:"Impossible d'enregistrer ce cours."});}finally{setSaving(false);} }
  async function deleteTimetableEntry(entry:TimetableEntry){ if(!window.confirm("Retirer ce cours de l'emploi du temps ?"))return; setDeletingId(entry.id); try{const {error}=await supabase.from("timetable_entries").delete().eq("id",entry.id).eq("school_id",schoolId); if(error)throw error; setTimetableEntries((p)=>p.filter((i)=>i.id!==entry.id)); setEntryModalOpen(false);setEntryForm(EMPTY_ENTRY_FORM);setNotice({type:"success",text:"Cours retiré de l'emploi du temps."});}catch(error){setNotice({type:"error",text:error instanceof Error?error.message:"Impossible de retirer ce cours."});}finally{setDeletingId(null);} }


  const selectedTimetableEntries = useMemo(
    () =>
      timetableEntries.filter(
        (entry) => entry.timetable_id === selectedTimetableId
      ),
    [timetableEntries, selectedTimetableId]
  );

  const timetableIsEditable =
    selectedTimetable?.status === "draft" ||
    selectedTimetable?.status === "generated" ||
    selectedTimetable?.status === "review";

  const timetableIsPublished =
    selectedTimetable?.status === "published";

  function getTimetableControlIssues() {
    if (!selectedTimetable) {
      return ["Aucun emploi du temps sélectionné."];
    }

    const issues: string[] = [];

    const timetableClasses = classes.filter(
      (schoolClass) =>
        schoolClass.academic_year_id === selectedTimetable.academic_year_id
    );

    for (const schoolClass of timetableClasses) {
      const configured = classSubjects.filter(
        (item) =>
          item.class_id === schoolClass.id &&
          item.academic_year_id === selectedTimetable.academic_year_id &&
          item.is_active
      );

      for (const classSubject of configured) {
        const subject = subjects.find(
          (item) => item.id === classSubject.subject_id
        );

        const assignment = teacherAssignments.find(
          (item) =>
            item.class_subject_id === classSubject.id &&
            item.academic_year_id === selectedTimetable.academic_year_id &&
            item.status === "active"
        );

        if (!assignment) {
          issues.push(
            `${schoolClass.name} · ${
              subject?.name ?? "Matière"
            } : aucun enseignant affecté.`
          );
          continue;
        }

        if (classSubject.hours_per_week == null) {
          issues.push(
            `${schoolClass.name} · ${
              subject?.name ?? "Matière"
            } : volume horaire hebdomadaire non défini.`
          );
          continue;
        }

        const planned = selectedTimetableEntries
          .filter(
            (entry) =>
              entry.class_id === schoolClass.id &&
              entry.class_subject_id === classSubject.id
          )
          .reduce(
            (sum, entry) =>
              sum + slotDurationHours(entry.time_slot_id),
            0
          );

        const target = Number(classSubject.hours_per_week);

        if (planned < target) {
          issues.push(
            `${schoolClass.name} · ${
              subject?.name ?? "Matière"
            } : ${planned.toLocaleString(
              "fr-FR"
            )} h planifiée(s) sur ${target.toLocaleString(
              "fr-FR"
            )} h.`
          );
        } else if (planned > target) {
          issues.push(
            `${schoolClass.name} · ${
              subject?.name ?? "Matière"
            } : dépassement (${planned.toLocaleString(
              "fr-FR"
            )} h planifiée(s) pour ${target.toLocaleString(
              "fr-FR"
            )} h prévues).`
          );
        }
      }
    }

    return issues;
  }

  function controlTimetable() {
    const issues = getTimetableControlIssues();

    if (issues.length === 0) {
      setNotice({
        type: "success",
        text:
          "Contrôle terminé : aucun problème bloquant détecté. L'emploi du temps peut être validé.",
      });
      return true;
    }

    setNotice({
      type: "error",
      text: `Contrôle terminé : ${issues.length} problème(s) à corriger. ${issues
        .slice(0, 3)
        .join(" | ")}${
        issues.length > 3
          ? ` | +${issues.length - 3} autre(s)`
          : ""
      }`,
    });

    return false;
  }

  async function updateTimetableWorkflow(
    nextStatus:
      | "review"
      | "validated"
      | "published"
      | "archived"
  ) {
    if (!selectedTimetable || !schoolId) return;

    if (nextStatus === "validated") {
      const issues = getTimetableControlIssues();

      if (issues.length > 0) {
        setNotice({
          type: "error",
          text: `Validation impossible : ${issues.length} problème(s) restent à corriger. ${issues
            .slice(0, 3)
            .join(" | ")}${
            issues.length > 3
              ? ` | +${issues.length - 3} autre(s)`
              : ""
          }`,
        });
        return;
      }
    }

    if (
      nextStatus === "published" &&
      selectedTimetable.status !== "validated"
    ) {
      setNotice({
        type: "error",
        text:
          "L'emploi du temps doit être validé avant d'être publié.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const now = new Date().toISOString();

      const payload: Record<string, unknown> = {
        status: nextStatus,
      };

      if (nextStatus === "validated") {
        payload.validated_by = profile?.id ?? null;
        payload.validated_at = now;
      }

      if (nextStatus === "published") {
        payload.published_at = now;
      }

      const { data, error } = await supabase
        .from("timetables")
        .update(payload)
        .eq("id", selectedTimetable.id)
        .eq("school_id", schoolId)
        .select(
          "id, school_id, academic_year_id, name, version, status, source, valid_from, valid_until, created_by, validated_by, validated_at, published_at, created_at, updated_at"
        )
        .single();

      if (error) throw error;

      setTimetables((previous) =>
        previous.map((item) =>
          item.id === selectedTimetable.id
            ? (data as Timetable)
            : item
        )
      );

      const messages: Record<typeof nextStatus, string> = {
        review: "L'emploi du temps est maintenant en révision.",
        validated:
          "Emploi du temps validé. La grille est maintenant verrouillée.",
        published:
          "Emploi du temps publié. Il devient la version officielle.",
        archived: "Emploi du temps archivé.",
      };

      setNotice({
        type: "success",
        text: messages[nextStatus],
      });
    } catch (error) {
      console.error("ERREUR WORKFLOW EMPLOI DU TEMPS :", error);

      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le statut de l'emploi du temps.",
      });
    } finally {
      setSaving(false);
    }
  }

  const filteredRooms = useMemo(() => {
    const query = roomSearch.trim().toLowerCase();

    if (!query) {
      return rooms;
    }

    return rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(query) ||
        (room.code ?? "").toLowerCase().includes(query)
    );
  }, [rooms, roomSearch]);

  const roomStats = useMemo(
    () => ({
      total: rooms.length,
      active: rooms.filter((room) => room.is_active).length,
      inactive: rooms.filter((room) => !room.is_active).length,
      capacity: rooms.reduce(
        (sum, room) => sum + (room.capacity ?? 0),
        0
      ),
    }),
    [rooms]
  );

  function openCreateRoom() {
    setRoomForm(EMPTY_ROOM_FORM);
    setNotice(null);
    setRoomModalOpen(true);
  }

  function openEditRoom(room: Room) {
    setRoomForm({
      id: room.id,
      name: room.name,
      code: room.code ?? "",
      capacity:
        room.capacity != null ? String(room.capacity) : "",
      isActive: room.is_active,
    });

    setNotice(null);
    setRoomModalOpen(true);
  }

  async function saveRoom() {
    if (!schoolId) return;

    if (!roomForm.name.trim()) {
      setNotice({
        type: "error",
        text: "Le nom de la salle est obligatoire.",
      });
      return;
    }

    const capacity = roomForm.capacity.trim()
      ? Number(roomForm.capacity)
      : null;

    if (
      capacity != null &&
      (!Number.isInteger(capacity) || capacity <= 0)
    ) {
      setNotice({
        type: "error",
        text: "La capacité doit être un nombre entier supérieur à 0.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      if (roomForm.id) {
        const { data, error } = await supabase
          .from("rooms")
          .update({
            name: roomForm.name.trim(),
            code: roomForm.code.trim() || null,
            capacity,
            is_active: roomForm.isActive,
          })
          .eq("id", roomForm.id)
          .eq("school_id", schoolId)
          .select(
            "id, school_id, name, code, room_type, capacity, is_active, configuration, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setRooms((previous) =>
          previous
            .map((item) =>
              item.id === roomForm.id
                ? (data as Room)
                : item
            )
            .sort((a, b) =>
              a.name.localeCompare(b.name, "fr")
            )
        );

        setNotice({
          type: "success",
          text: "Salle mise à jour.",
        });
      } else {
        /*
         * room_type reste volontairement "classroom".
         * C'est la valeur par défaut déjà confirmée dans le schéma.
         * On ajoutera les autres catégories seulement après audit
         * exact de rooms_type_check.
         */
        const { data, error } = await supabase
          .from("rooms")
          .insert({
            school_id: schoolId,
            name: roomForm.name.trim(),
            code: roomForm.code.trim() || null,
            room_type: "classroom",
            capacity,
            is_active: roomForm.isActive,
            configuration: {},
          })
          .select(
            "id, school_id, name, code, room_type, capacity, is_active, configuration, created_at, updated_at"
          )
          .single();

        if (error) throw error;

        setRooms((previous) =>
          [...previous, data as Room].sort((a, b) =>
            a.name.localeCompare(b.name, "fr")
          )
        );

        setNotice({
          type: "success",
          text: "Salle ajoutée.",
        });
      }

      setRoomModalOpen(false);
      setRoomForm(EMPTY_ROOM_FORM);
    } catch (error) {
      console.error("ERREUR SALLE :", error);

      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer cette salle.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleRoom(room: Room) {
    setSaving(true);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from("rooms")
        .update({
          is_active: !room.is_active,
        })
        .eq("id", room.id)
        .eq("school_id", schoolId)
        .select(
          "id, school_id, name, code, room_type, capacity, is_active, configuration, created_at, updated_at"
        )
        .single();

      if (error) throw error;

      setRooms((previous) =>
        previous.map((item) =>
          item.id === room.id ? (data as Room) : item
        )
      );

      setNotice({
        type: "success",
        text: data.is_active
          ? `${data.name} est maintenant active.`
          : `${data.name} est maintenant inactive.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de modifier cette salle.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoom(room: Room) {
    if (
      !window.confirm(
        `Supprimer définitivement la salle « ${room.name} » ?`
      )
    ) {
      return;
    }

    setDeletingId(room.id);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", room.id)
        .eq("school_id", schoolId);

      if (error) throw error;

      setRooms((previous) =>
        previous.filter((item) => item.id !== room.id)
      );

      setNotice({
        type: "success",
        text: "Salle supprimée.",
      });
    } catch (error) {
      console.error("ERREUR SUPPRESSION SALLE :", error);

      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cette salle. Elle peut déjà être utilisée dans un emploi du temps.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Sidebar
        userProfile={
          profile
            ? {
                first_name: profile.first_name,
                last_name: profile.last_name,
              }
            : null
        }
        userRole={userRole}
      />

      <div className="min-h-screen pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-6 lg:px-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Pédagogie</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-slate-600">
                  Emploi du temps
                </span>
              </div>

              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Emploi du temps
              </h1>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </button>
          </div>
        </header>

        <main className="px-6 py-7 lg:px-8 lg:py-8">
          <section className="mb-7 border-b border-slate-100 pb-7">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Organisation pédagogique
            </span>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Planification des cours
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Configurez les jours et créneaux de l&apos;établissement,
              puis utilisez-les pour construire les emplois du temps.
            </p>
          </section>

          {notice && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="flex-1">{notice.text}</span>
              <button type="button" onClick={() => setNotice(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Jours scolaires"
              value={loading ? "—" : String(stats.schoolDays)}
              detail={`${stats.allDays} jour(s) configuré(s)`}
              icon={<CalendarDays className="h-5 w-5" />}
            />

            <Metric
              label="Créneaux actifs"
              value={loading ? "—" : String(stats.activeSlots)}
              detail={`${stats.allSlots} créneau(x) configuré(s)`}
              icon={<Clock3 className="h-5 w-5" />}
            />

            <Metric
              label="Configuration"
              value={
                loading
                  ? "—"
                  : configurationReady
                  ? "Prête"
                  : "À compléter"
              }
              detail={
                configurationReady
                  ? "Base horaire disponible"
                  : "Jours et créneaux requis"
              }
              icon={<Settings2 className="h-5 w-5" />}
            />

            <Metric
              label="Emplois du temps"
              value="0"
              detail="Construction à l'étape suivante"
              icon={<CalendarDays className="h-5 w-5" />}
            />
          </section>

          <section className="mb-6 overflow-x-auto">
            <div className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-white p-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === "timetables" && (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader title="Emploi du temps des classes" subtitle="Sélectionnez une année, un brouillon et une classe pour construire sa grille hebdomadaire." action={
  canManage ? (
    <button
      type="button"
      disabled={saving || !selectedYearId}
      onClick={createDraftTimetable}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="h-4 w-4" />
      Nouveau brouillon
    </button>
  ) : null
}
                />
                <div className="grid gap-4 border-b border-slate-100 px-5 py-4 lg:grid-cols-3">
                  <Field label="Année scolaire"><select value={selectedYearId} onChange={(e)=>{setSelectedYearId(e.target.value);setSelectedTimetableId("");setSelectedClassId("");}} className={FIELD}>{years.map((y)=><option key={y.id} value={y.id}>{y.name}{y.is_active?" — active":""}</option>)}</select></Field>
                  <Field label="Emploi du temps"><select value={selectedTimetableId} onChange={(e)=>setSelectedTimetableId(e.target.value)} className={FIELD} disabled={!yearTimetables.length}>{yearTimetables.length?yearTimetables.map((t)=><option key={t.id} value={t.id}>{t.name} · v{t.version} · {t.status}</option>):<option value="">Aucun brouillon</option>}</select></Field>
                  <Field label="Classe"><select value={selectedClassId} onChange={(e)=>setSelectedClassId(e.target.value)} className={FIELD} disabled={!yearClasses.length}>{yearClasses.length?yearClasses.map((c)=><option key={c.id} value={c.id}>{c.name}</option>):<option value="">Aucune classe</option>}</select></Field>
                </div>
                {!configurationReady ? <EmptyBlock icon={<Clock3 className="h-7 w-7"/>} title="Configuration horaire requise" text="Configurez d'abord les jours scolaires et les créneaux horaires."/> : yearTimetables.length===0 ? <EmptyBlock icon={<CalendarDays className="h-7 w-7"/>} title="Aucun emploi du temps" text="Créez un brouillon pour commencer la planification."/> : !selectedClass ? <EmptyBlock icon={<CalendarDays className="h-7 w-7"/>} title="Aucune classe sélectionnée" text="Sélectionnez une classe."/> : (<>
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">
                          Classe sélectionnée
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                          {selectedClass.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {selectedClassSubjects.length} matière(s) configurée(s) ·{" "}
                          {selectedClassEntries.length} cours planifié(s)
                        </p>
                      </div>

                      {selectedTimetable && (
                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            État
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {selectedTimetable.status} · v
                            {selectedTimetable.version}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedTimetable && canManage && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                        {(selectedTimetable.status === "draft" ||
                          selectedTimetable.status === "generated") && (
                          <>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={controlTimetable}
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Contrôler
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                updateTimetableWorkflow("review")
                              }
                              className="rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                            >
                              Passer en révision
                            </button>
                          </>
                        )}

                        {selectedTimetable.status === "review" && (
                          <>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={controlTimetable}
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Contrôler
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                updateTimetableWorkflow("validated")
                              }
                              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Valider
                            </button>
                          </>
                        )}

                        {selectedTimetable.status === "validated" && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              updateTimetableWorkflow("published")
                            }
                            className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Publier
                          </button>
                        )}

                        {selectedTimetable.status === "published" && (
                          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                            Version officielle publiée
                          </span>
                        )}

                        {selectedTimetable.status !== "archived" &&
                          selectedTimetable.status === "published" && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                updateTimetableWorkflow("archived")
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Archiver
                            </button>
                          )}
                      </div>
                    )}

                    {selectedTimetable &&
                      !timetableIsEditable &&
                      selectedTimetable.status !== "archived" && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                          <p className="text-xs font-semibold text-amber-700">
                            Grille verrouillée
                          </p>
                          <p className="mt-1 text-xs text-amber-600/80">
                            Cet emploi du temps a été validé ou publié. Les
                            cours ne peuvent plus être modifiés depuis cette
                            version.
                          </p>
                        </div>
                      )}
                  </div>
                  <div className="overflow-x-auto p-5"><table className="w-full min-w-[980px] border-separate border-spacing-0"><thead><tr><th className="sticky left-0 z-20 w-[150px] border-b border-r border-slate-200 bg-white px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Créneau</th>{activeSchoolDays.map((d)=><th key={d.id} className="min-w-[165px] border-b border-slate-200 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{d.name}</th>)}</tr></thead><tbody>{activeTimeSlots.map((s)=><tr key={s.id}><td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-3"><p className="text-xs font-semibold text-slate-700">{s.name}</p><p className="mt-1 text-[10px] text-slate-400">{shortTime(s.start_time)}–{shortTime(s.end_time)}</p></td>{activeSchoolDays.map((d)=>{const e=selectedClassEntries.find((x)=>x.school_day_id===d.id&&x.time_slot_id===s.id)??null;return <td key={`${d.id}-${s.id}`} className="border-b border-slate-100 p-2 align-top">{e?<button type="button" onClick={()=>openEditEntry(e)} className="min-h-[96px] w-full rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-left"><p className="text-xs font-bold text-indigo-800">{getSubjectName(e.class_subject_id)}</p><p className="mt-1 text-[10px] font-medium text-slate-600">{getTeacherNameFromAssignment(e.teacher_assignment_id)}</p>{e.room_id&&<p className="mt-2 text-[10px] text-slate-400">{getRoomName(e.room_id)}</p>}</button>:canManage?<button type="button" onClick={()=>openCreateEntry(d.id,s.id)} className="flex min-h-[96px] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-semibold text-slate-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"><Plus className="mr-1.5 h-4 w-4"/>Ajouter</button>:<div className="min-h-[96px] rounded-xl border border-dashed border-slate-100"/>}</td>})}</tr>)}</tbody></table></div>
                </>)}
              </section>
              {selectedClass&&selectedClassSubjects.length>0&&<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><SectionHeader title="Progression des volumes horaires" subtitle="Comparaison entre le volume hebdomadaire configuré et les créneaux planifiés." action={null}/><div className="divide-y divide-slate-100">{selectedClassSubjects.map((cs)=>{const subj=subjects.find((x)=>x.id===cs.subject_id);const planned=plannedHoursForClassSubject(cs.id);const target=cs.hours_per_week;const progress=target&&target>0?Math.min(100,Math.round(planned/target*100)):0;const a=getAssignmentForClassSubject(cs.id);return <div key={cs.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.4fr_1fr_180px]"><div><p className="text-sm font-bold text-slate-800">{subj?.name??"Matière"}</p><p className="mt-1 text-xs text-slate-400">{a?getTeacherNameFromAssignment(a.id):"Aucun enseignant affecté"}</p></div><div><div className="flex items-center justify-between text-xs"><span className="text-slate-400">Planifié</span><span className="font-bold text-slate-700">{planned.toLocaleString("fr-FR")} h{target!=null?` / ${Number(target).toLocaleString("fr-FR")} h`:""}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{width:`${progress}%`}}/></div></div><div className="text-right">{target==null?<span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Volume non défini</span>:planned<target?<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Reste {(target-planned).toLocaleString("fr-FR")} h</span>:planned===target?<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Complet</span>:<span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">Dépassement</span>}</div></div>})}</div></section>}
            </div>
          )}

          {activeTab === "configuration" && (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader
                  title="Jours scolaires"
                  subtitle="Définissez les jours pendant lesquels l'établissement organise des cours."
                  action={
                    canManage && schoolDays.length < 7 ? (
                      <button
                        type="button"
                        onClick={openCreateDay}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter un jour
                      </button>
                    ) : null
                  }
                />

                {loading ? (
                  <LoadingBlock />
                ) : schoolDays.length === 0 ? (
                  <EmptyBlock
                    icon={<CalendarDays className="h-7 w-7" />}
                    title="Aucun jour configuré"
                    text="Ajoutez les jours de fonctionnement de l'établissement."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {schoolDays.map((day) => (
                      <div
                        key={day.id}
                        className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <CalendarDays className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">
                              {day.name}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                day.is_school_day
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {day.is_school_day ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {day.short_name ?? "Sans abréviation"} · Ordre{" "}
                            {day.display_order}
                          </p>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => toggleDay(day)}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {day.is_school_day
                                ? "Désactiver"
                                : "Activer"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditDay(day)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === day.id}
                              onClick={() => deleteDay(day)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader
                  title="Créneaux horaires"
                  subtitle="Définissez les périodes de cours utilisables dans la grille."
                  action={
                    canManage ? (
                      <button
                        type="button"
                        onClick={openCreateSlot}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        Nouveau créneau
                      </button>
                    ) : null
                  }
                />

                {loading ? (
                  <LoadingBlock />
                ) : timeSlots.length === 0 ? (
                  <EmptyBlock
                    icon={<Clock3 className="h-7 w-7" />}
                    title="Aucun créneau configuré"
                    text="Ajoutez les créneaux horaires utilisés pour les cours."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-5 py-3">Créneau</th>
                          <th className="px-4 py-3">Début</th>
                          <th className="px-4 py-3">Fin</th>
                          <th className="px-4 py-3">Ordre</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {timeSlots.map((slot) => (
                          <tr key={slot.id}>
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {slot.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {shortTime(slot.start_time)}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {shortTime(slot.end_time)}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-500">
                              {slot.display_order}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  slot.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {slot.is_active ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {canManage && (
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => toggleSlot(slot)}
                                    className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                                  >
                                    {slot.is_active
                                      ? "Désactiver"
                                      : "Activer"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditSlot(slot)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deletingId === slot.id}
                                    onClick={() => deleteSlot(slot)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "calendar" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <SectionHeader
                title="Calendrier scolaire"
                subtitle="Centralisez jours fériés, vacances, fermetures, examens et autres exceptions de l'année."
                action={
                  canManage ? (
                    <button
                      type="button"
                      onClick={openCreateCalendarException}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une exception
                    </button>
                  ) : null
                }
              />

              <div className="border-b border-slate-100 px-5 py-4">
                <div className="max-w-sm">
                  <Field label="Année scolaire">
                    <select
                      value={selectedYearId}
                      onChange={(e) => setSelectedYearId(e.target.value)}
                      className={FIELD}
                    >
                      {years.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name}
                          {year.is_active ? " — active" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {loading ? (
                <LoadingBlock />
              ) : !selectedYearId ? (
                <EmptyBlock
                  icon={<CalendarDays className="h-7 w-7" />}
                  title="Aucune année scolaire"
                  text="Créez d'abord une année scolaire pour utiliser le calendrier."
                />
              ) : filteredCalendarExceptions.length === 0 ? (
                <EmptyBlock
                  icon={<CalendarDays className="h-7 w-7" />}
                  title="Calendrier vide"
                  text={`Aucune exception enregistrée pour ${currentYear?.name ?? "cette année"}.`}
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredCalendarExceptions.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {item.title}
                          </p>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                            {CALENDAR_TYPE_LABELS[item.exception_type]}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.is_active ? "Actif" : "Inactif"}
                          </span>

                          {item.affects_teaching && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              Cours bloqués
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.start_date === item.end_date
                            ? item.start_date
                            : `${item.start_date} → ${item.end_date}`}
                          {" · "}
                          {CALENDAR_SOURCE_LABELS[item.source]}
                        </p>

                        {item.notes && (
                          <p className="mt-1 text-xs text-slate-400">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-slate-400">
                        <p>
                          Personnel :{" "}
                          <span className="font-semibold text-slate-600">
                            {item.affects_staff ? "impacté" : "non impacté"}
                          </span>
                        </p>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => toggleCalendarException(item)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {item.is_active ? "Désactiver" : "Activer"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditCalendarException(item)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => deleteCalendarException(item)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "availability" && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Enseignants"
                  value={String(availabilityStats.total)}
                  detail={currentYear?.name ?? "Année non définie"}
                  icon={<UsersRound className="h-5 w-5" />}
                />

                <Metric
                  label="Disponibilités complètes"
                  value={String(availabilityStats.completed)}
                  detail="Tous les créneaux renseignés"
                  icon={<Check className="h-5 w-5" />}
                />

                <Metric
                  label="En cours"
                  value={String(availabilityStats.started)}
                  detail="Saisie commencée"
                  icon={<Clock3 className="h-5 w-5" />}
                />

                <Metric
                  label="Non renseignées"
                  value={String(availabilityStats.notStarted)}
                  detail="À compléter par les enseignants"
                  icon={<UsersRound className="h-5 w-5" />}
                />
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader
                  title="Supervision des disponibilités"
                  subtitle="Les enseignants renseignent leurs disponibilités depuis leur espace. Cette vue permet au Directeur de suivre l'avancement."
                  action={null}
                />

                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        value={availabilitySearch}
                        onChange={(e) =>
                          setAvailabilitySearch(e.target.value)
                        }
                        placeholder="Rechercher un enseignant..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    <select
                      value={selectedYearId}
                      onChange={(e) => {
                        setSelectedYearId(e.target.value);
                        setSelectedTeacherId("");
                      }}
                      className={FIELD}
                    >
                      {years.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name}
                          {year.is_active ? " — active" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!configurationReady ? (
                  <EmptyBlock
                    icon={<Clock3 className="h-7 w-7" />}
                    title="Configuration horaire incomplète"
                    text="Les jours scolaires et créneaux actifs doivent être configurés avant de superviser les disponibilités."
                  />
                ) : filteredAvailabilitySummaries.length === 0 ? (
                  <EmptyBlock
                    icon={<UsersRound className="h-7 w-7" />}
                    title="Aucun enseignant trouvé"
                    text="Aucun enseignant ne correspond à la recherche."
                  />
                ) : (
                  <div className="grid min-h-[520px] xl:grid-cols-[360px_1fr]">
                    <aside className="border-b border-slate-100 xl:border-b-0 xl:border-r">
                      <div className="max-h-[640px] overflow-y-auto p-2">
                        {filteredAvailabilitySummaries.map((item) => (
                          <button
                            key={item.teacher.id}
                            type="button"
                            onClick={() =>
                              setSelectedTeacherId(item.teacher.id)
                            }
                            className={`mb-1 w-full rounded-xl border px-4 py-3 text-left transition ${
                              selectedTeacherId === item.teacher.id
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {item.name}
                                </p>

                                <p className="mt-1 truncate text-[11px] text-slate-400">
                                  {item.employeeNumber
                                    ? `Matricule : ${item.employeeNumber}`
                                    : item.email || "Sans matricule"}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                                  item.completionRate === 100
                                    ? "bg-emerald-50 text-emerald-700"
                                    : item.completionRate > 0
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {item.completionRate}%
                              </span>
                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                  width: `${item.completionRate}%`,
                                }}
                              />
                            </div>

                            <p className="mt-2 text-[10px] text-slate-400">
                              {item.completedSlots}/{item.totalSlots} créneaux renseignés
                            </p>
                          </button>
                        ))}
                      </div>
                    </aside>

                    <section>
                      {!selectedAvailabilityTeacher ? (
                        <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
                          <UsersRound className="h-9 w-9 text-slate-300" />
                          <h3 className="mt-4 text-sm font-bold text-slate-700">
                            Sélectionnez un enseignant
                          </h3>
                          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
                            Sa grille de disponibilités apparaîtra ici.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="border-b border-slate-100 px-5 py-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                                  Disponibilités enseignant
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-950">
                                  {selectedAvailabilityTeacher.name}
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                  {selectedAvailabilityTeacher.completedSlots}/
                                  {selectedAvailabilityTeacher.totalSlots} créneaux renseignés
                                </p>
                              </div>

                              <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                                <p className="text-[10px] font-semibold uppercase text-slate-400">
                                  Complétude
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-800">
                                  {selectedAvailabilityTeacher.completionRate}%
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto p-5">
                            <table className="w-full min-w-[760px] border-separate border-spacing-0">
                              <thead>
                                <tr>
                                  <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                    Créneau
                                  </th>

                                  {activeSchoolDays.map((day) => (
                                    <th
                                      key={day.id}
                                      className="border-b border-slate-200 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
                                    >
                                      {day.short_name ?? day.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              <tbody>
                                {activeTimeSlots.map((slot) => (
                                  <tr key={slot.id}>
                                    <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-3">
                                      <p className="text-xs font-semibold text-slate-700">
                                        {slot.name}
                                      </p>
                                      <p className="mt-1 text-[10px] text-slate-400">
                                        {shortTime(slot.start_time)}–{shortTime(slot.end_time)}
                                      </p>
                                    </td>

                                    {activeSchoolDays.map((day) => {
                                      const entry =
                                        selectedAvailabilityTeacher.entries.find(
                                          (item) =>
                                            item.school_day_id === day.id &&
                                            item.time_slot_id === slot.id
                                        ) ?? null;

                                      return (
                                        <td
                                          key={`${day.id}-${slot.id}`}
                                          className="border-b border-slate-100 px-2 py-2 text-center"
                                        >
                                          {entry ? (
                                            <div
                                              className={`rounded-xl border px-2 py-2 ${
                                                entry.availability_status === "available"
                                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                                  : entry.availability_status === "preferred"
                                                  ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                                                  : entry.availability_status === "avoid"
                                                  ? "border-amber-100 bg-amber-50 text-amber-700"
                                                  : "border-red-100 bg-red-50 text-red-700"
                                              }`}
                                              title={
                                                entry.reason
                                                  ? `${AVAILABILITY_STATUS_LABELS[entry.availability_status]} — ${entry.reason}`
                                                  : AVAILABILITY_STATUS_LABELS[entry.availability_status]
                                              }
                                            >
                                              <p className="text-[10px] font-bold">
                                                {AVAILABILITY_STATUS_LABELS[
                                                  entry.availability_status
                                                ]}
                                              </p>

                                              <p className="mt-1 text-[9px] opacity-70">
                                                {AVAILABILITY_SOURCE_LABELS[entry.source]}
                                                {entry.is_locked ? " · Verrouillé" : ""}
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="rounded-xl border border-dashed border-slate-200 px-2 py-3 text-[10px] font-semibold text-slate-300">
                                              Non renseigné
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                            <p className="text-xs font-semibold text-slate-600">
                              Vue de supervision uniquement
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              La saisie normale des disponibilités sera faite dans l&apos;espace Enseignant. Cette page consomme les mêmes données sans créer une seconde source d&apos;information.
                            </p>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Salles"
                  value={String(roomStats.total)}
                  detail="Enregistrées dans l'établissement"
                  icon={<DoorOpen className="h-5 w-5" />}
                />

                <Metric
                  label="Actives"
                  value={String(roomStats.active)}
                  detail="Disponibles pour le planning"
                  icon={<Check className="h-5 w-5" />}
                />

                <Metric
                  label="Inactives"
                  value={String(roomStats.inactive)}
                  detail="Non utilisées actuellement"
                  icon={<DoorOpen className="h-5 w-5" />}
                />

                <Metric
                  label="Capacité déclarée"
                  value={String(roomStats.capacity)}
                  detail="Somme des capacités renseignées"
                  icon={<UsersRound className="h-5 w-5" />}
                />
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader
                  title="Salles et espaces"
                  subtitle="Les salles actives pourront être associées aux cours dans la grille d'emploi du temps."
                  action={
                    canManage ? (
                      <button
                        type="button"
                        onClick={openCreateRoom}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        Nouvelle salle
                      </button>
                    ) : null
                  }
                />

                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="relative max-w-xl">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      placeholder="Rechercher une salle ou un code..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                {loading ? (
                  <LoadingBlock />
                ) : filteredRooms.length === 0 ? (
                  <EmptyBlock
                    icon={<DoorOpen className="h-7 w-7" />}
                    title={
                      rooms.length === 0
                        ? "Aucune salle enregistrée"
                        : "Aucune salle trouvée"
                    }
                    text={
                      rooms.length === 0
                        ? "Ajoutez les salles ou espaces utilisés pour les cours."
                        : "Aucune salle ne correspond à votre recherche."
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-5 py-3">Salle</th>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Capacité</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredRooms.map((room) => (
                          <tr
                            key={room.id}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                  <DoorOpen className="h-4 w-4" />
                                </div>

                                <p className="text-sm font-semibold text-slate-800">
                                  {room.name}
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-500">
                              {room.code || "—"}
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                {room.room_type === "classroom"
                                  ? "Salle de classe"
                                  : room.room_type}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                              {room.capacity ?? "Non définie"}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  room.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {room.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              {canManage && (
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => toggleRoom(room)}
                                    className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                                  >
                                    {room.is_active
                                      ? "Désactiver"
                                      : "Activer"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditRoom(room)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={deletingId === room.id}
                                    onClick={() => deleteRoom(room)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
                <p className="text-xs font-semibold text-indigo-700">
                  Utilisation dans le planning
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-600/80">
                  Lorsqu'une salle sera affectée à un cours, EduSoft
                  empêchera automatiquement son utilisation simultanée
                  dans deux classes grâce à la protection déjà présente
                  sur timetable_entries.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {dayModalOpen && (
        <Modal
          title={dayForm.id ? "Modifier le jour" : "Ajouter un jour"}
          subtitle="Configurez un jour de fonctionnement de l'établissement."
          onClose={() => !saving && setDayModalOpen(false)}
        >
          <div className="space-y-5">
            <Field label="Jour de la semaine">
              <select
                value={dayForm.dayOfWeek}
                onChange={(e) => changeWeekDay(e.target.value)}
                disabled={Boolean(dayForm.id)}
                className={FIELD}
              >
                {WEEK_DAYS.map((day) => {
                  const used = schoolDays.some(
                    (existing) =>
                      existing.day_of_week === day.value &&
                      existing.id !== dayForm.id
                  );

                  return (
                    <option
                      key={day.value}
                      value={day.value}
                      disabled={used}
                    >
                      {day.name}
                      {used ? " — déjà configuré" : ""}
                    </option>
                  );
                })}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom affiché">
                <input
                  value={dayForm.name}
                  onChange={(e) =>
                    setDayForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className={FIELD}
                />
              </Field>

              <Field label="Abréviation">
                <input
                  value={dayForm.shortName}
                  onChange={(e) =>
                    setDayForm((p) => ({
                      ...p,
                      shortName: e.target.value,
                    }))
                  }
                  className={FIELD}
                />
              </Field>
            </div>

            <Field label="Ordre d'affichage">
              <input
                type="number"
                min="1"
                value={dayForm.displayOrder}
                onChange={(e) =>
                  setDayForm((p) => ({
                    ...p,
                    displayOrder: e.target.value,
                  }))
                }
                className={FIELD}
              />
            </Field>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Jour scolaire actif
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Ce jour pourra recevoir des cours.
                </p>
              </div>

              <input
                type="checkbox"
                checked={dayForm.isSchoolDay}
                onChange={(e) =>
                  setDayForm((p) => ({
                    ...p,
                    isSchoolDay: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
            </label>
          </div>

          <ModalFooter
            saving={saving}
            label={dayForm.id ? "Enregistrer" : "Ajouter le jour"}
            onCancel={() => setDayModalOpen(false)}
            onSave={saveDay}
          />
        </Modal>
      )}

      {slotModalOpen && (
        <Modal
          title={slotForm.id ? "Modifier le créneau" : "Nouveau créneau"}
          subtitle="Définissez une période horaire de cours."
          onClose={() => !saving && setSlotModalOpen(false)}
        >
          <div className="space-y-5">
            <Field label="Nom du créneau">
              <input
                value={slotForm.name}
                onChange={(e) =>
                  setSlotForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ex. 1er cours"
                className={FIELD}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Heure de début">
                <input
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) =>
                    setSlotForm((p) => ({
                      ...p,
                      startTime: e.target.value,
                    }))
                  }
                  className={FIELD}
                />
              </Field>

              <Field label="Heure de fin">
                <input
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) =>
                    setSlotForm((p) => ({
                      ...p,
                      endTime: e.target.value,
                    }))
                  }
                  className={FIELD}
                />
              </Field>
            </div>

            <Field label="Ordre d'affichage">
              <input
                type="number"
                min="1"
                value={slotForm.displayOrder}
                onChange={(e) =>
                  setSlotForm((p) => ({
                    ...p,
                    displayOrder: e.target.value,
                  }))
                }
                className={FIELD}
              />
            </Field>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Créneau actif
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Disponible dans la future grille.
                </p>
              </div>

              <input
                type="checkbox"
                checked={slotForm.isActive}
                onChange={(e) =>
                  setSlotForm((p) => ({
                    ...p,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
            </label>
          </div>

          <ModalFooter
            saving={saving}
            label={slotForm.id ? "Enregistrer" : "Créer le créneau"}
            onCancel={() => setSlotModalOpen(false)}
            onSave={saveSlot}
          />
        </Modal>
      )}

      {calendarModalOpen && (
        <Modal
          title={
            calendarForm.id
              ? "Modifier l'exception"
              : "Ajouter au calendrier"
          }
          subtitle={`Calendrier scolaire${currentYear ? ` · ${currentYear.name}` : ""}`}
          onClose={() => !saving && setCalendarModalOpen(false)}
        >
          <div className="space-y-5">
            <Field label="Titre">
              <input
                value={calendarForm.title}
                onChange={(e) =>
                  setCalendarForm((p) => ({
                    ...p,
                    title: e.target.value,
                  }))
                }
                placeholder="Ex. Fête de l'Indépendance"
                className={FIELD}
              />
            </Field>

            <Field label="Type">
              <select
                value={calendarForm.exceptionType}
                onChange={(e) =>
                  setCalendarForm((p) => ({
                    ...p,
                    exceptionType:
                      e.target.value as CalendarExceptionType,
                  }))
                }
                className={FIELD}
              >
                {(
                  Object.keys(
                    CALENDAR_TYPE_LABELS
                  ) as CalendarExceptionType[]
                ).map((type) => (
                  <option key={type} value={type}>
                    {CALENDAR_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date de début">
                <input
                  type="date"
                  value={calendarForm.startDate}
                  onChange={(e) =>
                    setCalendarForm((p) => ({
                      ...p,
                      startDate: e.target.value,
                      endDate:
                        !p.endDate || p.endDate < e.target.value
                          ? e.target.value
                          : p.endDate,
                    }))
                  }
                  className={FIELD}
                />
              </Field>

              <Field label="Date de fin">
                <input
                  type="date"
                  min={calendarForm.startDate || undefined}
                  value={calendarForm.endDate}
                  onChange={(e) =>
                    setCalendarForm((p) => ({
                      ...p,
                      endDate: e.target.value,
                    }))
                  }
                  className={FIELD}
                />
              </Field>
            </div>

            <Field label="Source">
              <select
                value={calendarForm.source}
                onChange={(e) =>
                  setCalendarForm((p) => ({
                    ...p,
                    source: e.target.value as CalendarSource,
                  }))
                }
                className={FIELD}
              >
                <option value="school">Établissement</option>
                <option value="official">Officiel</option>
                <option value="imported">Importé</option>
              </select>
            </Field>

            <div className="grid gap-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Bloque les cours
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Le générateur et le planning devront éviter cette période.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={calendarForm.affectsTeaching}
                  onChange={(e) =>
                    setCalendarForm((p) => ({
                      ...p,
                      affectsTeaching: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Affecte aussi le personnel
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Utile pour les jours fériés ou fermetures générales.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={calendarForm.affectsStaff}
                  onChange={(e) =>
                    setCalendarForm((p) => ({
                      ...p,
                      affectsStaff: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Événement actif
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Désactivez-le sans le supprimer de l'historique.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={calendarForm.isActive}
                  onChange={(e) =>
                    setCalendarForm((p) => ({
                      ...p,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>
            </div>

            <Field label="Notes">
              <textarea
                rows={3}
                value={calendarForm.notes}
                onChange={(e) =>
                  setCalendarForm((p) => ({
                    ...p,
                    notes: e.target.value,
                  }))
                }
                placeholder="Informations complémentaires..."
                className={FIELD}
              />
            </Field>
          </div>

          <ModalFooter
            saving={saving}
            label={
              calendarForm.id
                ? "Enregistrer"
                : "Ajouter au calendrier"
            }
            onCancel={() => setCalendarModalOpen(false)}
            onSave={saveCalendarException}
          />
        </Modal>
      )}

      {entryModalOpen && (
        <Modal title={entryForm.id ? "Modifier le cours" : "Ajouter un cours"} subtitle={`${selectedClass?.name ?? "Classe"} · ${activeSchoolDays.find((d)=>d.id===entryForm.schoolDayId)?.name ?? ""} · ${activeTimeSlots.find((s)=>s.id===entryForm.timeSlotId)?.name ?? ""}`} onClose={()=>!saving&&setEntryModalOpen(false)}>
          <div className="space-y-5">
            <Field label="Matière"><select value={entryForm.classSubjectId} onChange={(e)=>setEntryForm((p)=>({...p,classSubjectId:e.target.value}))} className={FIELD}><option value="">Sélectionner une matière</option>{selectedClassSubjects.map((cs)=>{const s=subjects.find((x)=>x.id===cs.subject_id);const a=getAssignmentForClassSubject(cs.id);return <option key={cs.id} value={cs.id} disabled={!a}>{s?.name??"Matière"}{!a?" — aucun enseignant affecté":""}</option>})}</select></Field>
            {entryForm.classSubjectId&&<div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"><p className="text-xs font-semibold text-slate-700">Enseignant</p><p className="mt-1 text-sm font-bold text-slate-900">{(()=>{const a=getAssignmentForClassSubject(entryForm.classSubjectId);return a?getTeacherNameFromAssignment(a.id):"Aucun enseignant affecté"})()}</p>{(()=>{const cs=selectedClassSubjects.find((x)=>x.id===entryForm.classSubjectId);if(!cs)return null;const p=plannedHoursForClassSubject(cs.id);return <p className="mt-1 text-xs text-slate-400">Volume déjà planifié : {p.toLocaleString("fr-FR")} h{cs.hours_per_week!=null?` / ${Number(cs.hours_per_week).toLocaleString("fr-FR")} h`:" · volume cible non défini"}</p>})()}</div>}
            <Field label="Salle (optionnelle)"><select value={entryForm.roomId} onChange={(e)=>setEntryForm((p)=>({...p,roomId:e.target.value}))} className={FIELD}><option value="">Aucune salle spécifique</option>{rooms.filter((r)=>r.is_active).map((r)=><option key={r.id} value={r.id}>{r.name}{r.capacity!=null?` · ${r.capacity} places`:""}</option>)}</select></Field>
            <Field label="Notes"><textarea rows={3} value={entryForm.notes} onChange={(e)=>setEntryForm((p)=>({...p,notes:e.target.value}))} className={FIELD}/></Field>
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5"><div>{entryForm.id&&<button type="button" disabled={deletingId===entryForm.id} onClick={()=>{const e=timetableEntries.find((x)=>x.id===entryForm.id);if(e)deleteTimetableEntry(e);}} className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-600">Retirer le cours</button>}</div><div className="flex gap-3"><button type="button" disabled={saving} onClick={()=>setEntryModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">Annuler</button><button type="button" disabled={saving||!entryForm.classSubjectId} onClick={saveTimetableEntry} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?"Enregistrement…":entryForm.id?"Enregistrer":"Ajouter le cours"}</button></div></div>
        </Modal>
      )}

      {roomModalOpen && (
        <Modal
          title={roomForm.id ? "Modifier la salle" : "Nouvelle salle"}
          subtitle="Enregistrez un espace pouvant être utilisé dans les emplois du temps."
          onClose={() => !saving && setRoomModalOpen(false)}
        >
          <div className="space-y-5">
            <Field label="Nom de la salle">
              <input
                value={roomForm.name}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
                placeholder="Ex. Salle 3A"
                className={FIELD}
              />
            </Field>

            <Field label="Code">
              <input
                value={roomForm.code}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    code: e.target.value,
                  }))
                }
                placeholder="Ex. S-3A"
                className={FIELD}
              />
            </Field>

            <Field label="Capacité">
              <input
                type="number"
                min="1"
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    capacity: e.target.value,
                  }))
                }
                placeholder="Ex. 35"
                className={FIELD}
              />
            </Field>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700">
                Type actuel : Salle de classe
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Les autres types de salles seront ajoutés après vérification
                exacte des valeurs autorisées par la base de données.
              </p>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Salle active
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Une salle inactive ne sera pas proposée dans la
                  planification.
                </p>
              </div>

              <input
                type="checkbox"
                checked={roomForm.isActive}
                onChange={(e) =>
                  setRoomForm((p) => ({
                    ...p,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
            </label>
          </div>

          <ModalFooter
            saving={saving}
            label={roomForm.id ? "Enregistrer" : "Créer la salle"}
            onCancel={() => setRoomModalOpen(false)}
            onSave={saveRoom}
          />
        </Modal>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center">
      <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
      <p className="mt-3 text-sm text-slate-400">Chargement…</p>
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
      <div className="text-slate-300">{icon}</div>
      <h4 className="mt-4 text-sm font-bold text-slate-700">{title}</h4>
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {text}
      </p>
    </div>
  );
}

function Placeholder({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto w-fit text-indigo-500">{icon}</div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </section>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({
  saving,
  label,
  onCancel,
  onSave,
}: {
  saving: boolean;
  label: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
      >
        Annuler
      </button>

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : label}
      </button>
    </div>
  );
}
