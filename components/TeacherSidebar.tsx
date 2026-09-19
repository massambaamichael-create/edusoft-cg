"use client";

import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type TeacherSidebarProps = {
  userName?: string;
  schoolName?: string | null;
};

const NAV = [
  {
    label: "Mon espace",
    href: "/enseignant",
    icon: LayoutDashboard,
  },
  {
    label: "Mes classes",
    href: "/enseignant/classes",
    icon: GraduationCap,
  },
  {
    label: "Mes matières",
    href: "/enseignant/matieres",
    icon: BookOpen,
  },
  {
    label: "Évaluations",
    href: "/enseignant/evaluations",
    icon: ClipboardList,
  },
  {
    label: "Emploi du temps",
    href: "/enseignant/emploi-du-temps",
    icon: CalendarDays,
  },
];

export default function TeacherSidebar({
  userName = "Enseignant",
  schoolName,
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("Impossible de se déconnecter.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      alert("Une erreur est survenue lors de la déconnexion.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0F766E] text-white">
      <div className="flex h-full flex-col">
        <div className="flex h-[78px] items-center border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight">
                Espace enseignant
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                {schoolName || "EduSoft CG"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Navigation
          </p>
          <div className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/enseignant" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-white/15 font-semibold text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-400/30">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-white/55">Enseignant</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-100 hover:bg-red-500/20 transition disabled:opacity-50"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>{loggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
