"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, LogOut, Menu, UserRound, X } from "lucide-react";
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
  accentClass: string;
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (role && !allowedRoles.includes(role)) {
      router.replace(getHomePathForRole(role));
    }
  }, [loading, isAuthenticated, role, router, allowedRoles]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      <main className="flex min-h-screen items-center justify-center bg-[#080B16] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 shadow-[0_0_35px_rgba(124,58,237,0.35)]">
            <span className="text-sm font-black">E</span>
          </div>
          <p className="mt-4 text-sm text-white/45">
            Chargement de l’espace {title}…
          </p>
        </div>
      </main>
    );
  }

  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[272px] border-r border-white/[0.07] text-white transition-transform duration-200 lg:translate-x-0 ${accentClass} ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[82px] items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 font-black shadow-[0_0_25px_rgba(124,58,237,0.28)]">
              E
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight">
                EduSoft CG
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-6">
          <div className="rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/70">
              Espace métier
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs leading-5 text-white/35">
              Navigation dédiée à votre rôle.
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
            Menu
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
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    active
                      ? "bg-white/[0.10] font-semibold text-white shadow-sm"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active
                        ? "bg-violet-500/15 text-violet-300"
                        : "bg-white/[0.035] text-white/35 group-hover:text-white/70"
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
              pathname === "/notifications"
                ? "bg-white/[0.10] font-semibold text-white shadow-sm"
                : "text-white/55 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                pathname === "/notifications"
                  ? "bg-violet-500/15 text-violet-300"
                  : "bg-white/[0.035] text-white/35 group-hover:text-white/70"
              }`}
            >
              <Bell className="h-[17px] w-[17px]" />
            </span>
            <span>Notifications</span>
          </button>
        </nav>

        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              <p className="truncate text-xs text-white/35">{role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
          >
            <LogOut className="h-[17px] w-[17px]" />
            <span>{loggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#080B16] text-white">
      {sidebar}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="min-h-screen lg:ml-[272px]">
        <div className="flex h-16 items-center border-b border-white/[0.07] bg-[#080B16]/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 text-white/70"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-3">
            <p className="text-sm font-bold">EduSoft CG</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
              {title}
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
