"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TeacherSidebar from "@/components/TeacherSidebar";
import { useCurrentUser } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/auth/routes";

export default function EnseignantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, school, role, loading, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    // Only teachers stay in this space; others go to their home
    if (role && role !== "Enseignant") {
      router.replace(getHomePathForRole(role));
    }
  }, [loading, isAuthenticated, role, router]);

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Enseignant";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-sm">Chargement de votre espace enseignant…</p>
      </main>
    );
  }

  if (!isAuthenticated || (role && role !== "Enseignant")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-sm">Redirection…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherSidebar userName={fullName} schoolName={school?.name} />
      <div className="ml-[260px] min-h-screen">{children}</div>
    </div>
  );
}
