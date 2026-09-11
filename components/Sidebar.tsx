"use client";

import {
  Activity,
  BookOpen,
  ChevronDown,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type SidebarUser = {
  first_name?: string | null;
  last_name?: string | null;
};

const NAVIGATION = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Administration", href: "/administration", icon: ShieldCheck },
  {
    label: "Pédagogie",
    href: "/pedagogie",
    icon: BookOpen,
    expandable: true,
    children: [
      { label: "Classes", href: "/pedagogie/classes" },
      { label: "Matières", href: "/pedagogie/matieres" },
      { label: "Emploi du temps", href: "/pedagogie/emploi-du-temps" },
      { label: "Notes & Bulletins", href: "/pedagogie/notes-bulletins" },
    ],
  },
  {
    label: "Enseignants",
    href: "/enseignants",
    icon: UsersRound,
    expandable: true,
    children: [
      { label: "Tous les enseignants", href: "/enseignants" },
      { label: "Affectations", href: "/enseignants/affectations" },
      { label: "Matières enseignées", href: "/enseignants/matieres" },
    ],
  },
  { label: "RH", href: "/rh", icon: UserRound },
  { label: "Communication", href: "/communication", icon: Mail },
  { label: "Discipline", href: "/discipline", icon: ShieldCheck },
  { label: "Examens", href: "/examens", icon: GraduationCap },
  { label: "Santé", href: "/sante", icon: Activity },
  { label: "Archives", href: "/archives", icon: FileSpreadsheet },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];

type SidebarProps = {
  userProfile?: SidebarUser | null;
  userRole?: string;
};

export default function Sidebar({ userProfile, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [pedagogieOpen, setPedagogieOpen] = useState(pathname.startsWith("/pedagogie"));
  const [enseignantsOpen, setEnseignantsOpen] = useState(pathname.startsWith("/enseignants"));

  const fullName =
    [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ") || "Utilisateur";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/[0.06] bg-[#080B18] text-white shadow-[12px_0_40px_rgba(0,0,0,0.18)]">
      <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_32%),linear-gradient(180deg,#0B1020_0%,#080B18_100%)]">
        {/* LOGO */}
        <div className="flex h-[82px] items-center border-b border-white/[0.07] px-5">
          <div className="flex w-full items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-[0_0_24px_rgba(99,102,241,0.16)]">
              <GraduationCap className="h-6 w-6 text-violet-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-bold tracking-[-0.02em] text-white">EduSoft CG</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Smart School Management
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
            Navigation
          </div>
          <div className="space-y-1">
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              const isPedagogie = item.label === "Pédagogie";
              const isEnseignants = item.label === "Enseignants";
              const isActive =
                item.href &&
                (pathname === item.href || pathname.startsWith(`${item.href}/`));
              const parentActive = isPedagogie
                ? pathname.startsWith("/pedagogie")
                : isEnseignants
                  ? pathname.startsWith("/enseignants")
                  : isActive;
              const isOpen =
                (isPedagogie && pedagogieOpen) || (isEnseignants && enseignantsOpen);

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPedagogie) setPedagogieOpen((previous) => !previous);
                      else if (isEnseignants) setEnseignantsOpen((previous) => !previous);
                      else if (item.href) router.push(item.href);
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                      parentActive
                        ? "bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.16)]"
                        : "text-white/55 hover:bg-white/[0.045] hover:text-white/90"
                    }`}
                  >
                    {parentActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    )}
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${parentActive ? "text-violet-300" : "text-white/40 group-hover:text-white/70"}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.expandable && (
                      <ChevronDown className={`h-4 w-4 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-180 text-violet-300" : ""}`} />
                    )}
                  </button>

                  {isOpen && item.children && (
                    <div className="ml-[18px] mt-1.5 space-y-0.5 border-l border-white/[0.08] pl-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <button
                            key={child.href}
                            type="button"
                            onClick={() => router.push(child.href)}
                            className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[12px] transition-all duration-200 ${
                              childActive
                                ? "bg-violet-500 text-white shadow-[0_6px_18px_rgba(99,102,241,0.18)]"
                                : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                            }`}
                          >
                            {childActive && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-white" />}
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* PROFIL */}
        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3 transition-colors hover:bg-white/[0.055]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_18px_rgba(99,102,241,0.22)]">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{fullName}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)]" />
                <p className="truncate text-[11px] text-white/40">{userRole || "Utilisateur"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
