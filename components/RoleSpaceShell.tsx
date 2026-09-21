"use client";

import type { LucideIcon } from "lucide-react";
import { LogOut, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { getHomePathForRole, type AppSpace } from "@/lib/auth/routes";
import type { RoleName } from "@/lib/auth/types";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type RoleSpaceShellProps = {
  space: AppSpace;
  title: string;
  accentClass: string; // e.g. bg-slate-900
  nav: NavItem[];
  allowedRoles: RoleName[];
  children: React.ReactNode;
};

export default function RoleSpaceShell({
  space,
  title,
  accentClass,
  nav,
  allowedRoles,
  children,
}: RoleSpaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, school, role, loading, isAuthenticated } = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (role && !allowedRoles.includes(role)) {
      router.replace(getHomePathForRole(role));
    }
  }, [loading, isAuthenticated, role, router, allowedRoles, pathname]);

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    title;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-sm">Chargement de l’espace {title}…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] text-white ${accentClass}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[78px] items-center border-b border-white/10 px-5">
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight">
                {title}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                {school?.name || "EduSoft CG"}
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Navigation
            </p>
            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== `/${space}` &&
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{fullName}</p>
                <p className="truncate text-xs text-white/55">{role}</p>
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

      <div className="ml-[260px] min-h-screen">{children}</div>
    </div>
  );
}
