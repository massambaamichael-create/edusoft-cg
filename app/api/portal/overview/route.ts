import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function authenticatedUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function GET(request: Request) {
  try {
    const authUser = await authenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, school_id, first_name, last_name, email, login_identifier, is_active, roles(name)")
      .eq("auth_user_id", authUser.id)
      .single();

    if (profileError || !profile || profile.is_active === false) {
      return NextResponse.json({ success: false, error: "Compte non autorisé." }, { status: 403 });
    }

    const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
    const roleName = (role as { name?: string } | null)?.name ?? "";

    let studentIds: string[] = [];

    if (roleName === "Parent") {
      const { data: parent } = await supabaseAdmin
        .from("parents")
        .select("id, first_name, last_name, phone, email")
        .eq("user_id", profile.id)
        .eq("school_id", profile.school_id)
        .single();

      if (!parent) {
        return NextResponse.json({ success: false, error: "Profil parent introuvable." }, { status: 404 });
      }

      const { data: links } = await supabaseAdmin
        .from("student_parents")
        .select("student_id, relationship")
        .eq("parent_id", parent.id);

      studentIds = (links ?? []).map((row) => row.student_id).filter(Boolean);
    } else if (roleName === "Élève") {
      const { data: student } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("user_id", profile.id)
        .eq("school_id", profile.school_id)
        .single();

      if (!student) {
        return NextResponse.json({ success: false, error: "Profil élève introuvable." }, { status: 404 });
      }

      studentIds = [student.id];
    } else {
      return NextResponse.json({ success: false, error: "Cet espace est réservé aux portails Parent et Élève." }, { status: 403 });
    }

    const students = studentIds.length
      ? (await supabaseAdmin
          .from("students")
          .select("id, first_name, last_name, registration_number, class_id, academic_year_id, status")
          .in("id", studentIds)
          .eq("school_id", profile.school_id)).data ?? []
      : [];

    const classIds = students.map((s) => s.class_id).filter(Boolean);
    const yearIds = students.map((s) => s.academic_year_id).filter(Boolean);

    const [classesRes, yearsRes, cardsRes, paymentsRes, attendanceRes] = await Promise.all([
      classIds.length
        ? supabaseAdmin.from("classes").select("id, name").in("id", classIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      yearIds.length
        ? supabaseAdmin.from("academic_years").select("id, name").in("id", yearIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      studentIds.length
        ? supabaseAdmin.from("report_cards").select("id, student_id, term, average, rank, decision, status, published_at").in("student_id", studentIds).eq("school_id", profile.school_id).eq("status", "published").order("term", { ascending: false })
        : Promise.resolve({ data: [] as unknown[] }),
      studentIds.length
        ? supabaseAdmin.from("payments").select("id, student_id, payment_type, amount, payment_date, payment_method, reference, status").in("student_id", studentIds).eq("status", "completed").order("payment_date", { ascending: false }).limit(100)
        : Promise.resolve({ data: [] as unknown[] }),
      studentIds.length
        ? supabaseAdmin.from("student_attendance").select("id, student_id, attendance_date, status, remark").in("student_id", studentIds).order("attendance_date", { ascending: false }).limit(100)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const classMap = new Map((classesRes.data ?? []).map((x) => [x.id, x.name]));
    const yearMap = new Map((yearsRes.data ?? []).map((x) => [x.id, x.name]));

    return NextResponse.json({
      success: true,
      role: roleName,
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        login_identifier: profile.login_identifier,
      },
      students: students.map((student) => ({
        ...student,
        class_name: classMap.get(student.class_id) ?? null,
        academic_year_name: yearMap.get(student.academic_year_id) ?? null,
      })),
      report_cards: cardsRes.data ?? [],
      payments: paymentsRes.data ?? [],
      attendance: attendanceRes.data ?? [],
    });
  } catch (error) {
    console.error("ERREUR PORTAL OVERVIEW :", error);
    return NextResponse.json({ success: false, error: "Impossible de charger votre espace." }, { status: 500 });
  }
}
