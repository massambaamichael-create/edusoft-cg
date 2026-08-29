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
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Administration",
    href: "/administration",
    icon: ShieldCheck,
  },
  {
    label: "Pédagogie",
    href: "/pedagogie",
    icon: BookOpen,
    expandable: true,
    children: [
      {
        label: "Classes",
        href: "/pedagogie/classes",
      },
      {
        label: "Matières",
        href: "/pedagogie/matieres",
      },
      {
        label: "Emploi du temps",
        href: "/pedagogie/emploi-du-temps",
      },
      {
        label: "Notes & Bulletins",
        href: "/pedagogie/notes-bulletins",
      },
    ],
  },
  {
  label: "Enseignants",
  href: "/enseignants",
  icon: UsersRound,
  expandable: true,
  children: [
    {
      label: "Tous les enseignants",
      href: "/enseignants",
    },
    {
      label: "Affectations",
      href: "/enseignants/affectations",
    },
    {
      label: "Matières enseignées",
      href: "/enseignants/matieres",
    },
  ],
},
  {
    label: "RH",
    href: "/rh",
    icon: UserRound,
  },
  {
    label: "Communication",
    href: "/communication",
    icon: Mail,
  },
  {
    label: "Discipline",
    href: "/discipline",
    icon: ShieldCheck,
  },
  {
    label: "Examens",
    href: "/examens",
    icon: GraduationCap,
  },
  {
    label: "Santé",
    href: "/sante",
    icon: Activity,
  },
  {
    label: "Archives",
    href: "/archives",
    icon: FileSpreadsheet,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

type SidebarProps = {
  userProfile?: SidebarUser | null;
  userRole?: string;
};

export default function Sidebar({
  userProfile,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [pedagogieOpen, setPedagogieOpen] = useState(
  pathname.startsWith("/pedagogie")
);

const [enseignantsOpen, setEnseignantsOpen] = useState(
  pathname.startsWith("/enseignants")
);

  const fullName =
    [
      userProfile?.first_name,
      userProfile?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Utilisateur";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[270px]
bg-[#1A2451] text-white">
      <div className="flex h-full flex-col">

        {/* LOGO */}
        <div className="flex h-[78px] items-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                EduSoft CG
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
                School Management
              </p>
            </div>

          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">

            {NAVIGATION.map((item) => {
              const Icon = item.icon;

              const isPedagogie =
  item.label === "Pédagogie";

const isEnseignants =
  item.label === "Enseignants";

              const isActive =
                item.href &&
                (pathname === item.href ||
                  pathname.startsWith(`${item.href}/`));

              return (
                <div key={item.label}>

                  <button
                    type="button"
                    onClick={() => {
  if (isPedagogie) {
    setPedagogieOpen((previous) => !previous);
  } else if (isEnseignants) {
    setEnseignantsOpen((previous) => !previous);
  } else if (item.href) {
    router.push(item.href);
  }
}}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition
                    ${
                      isActive || (isPedagogie && pathname.startsWith("/pedagogie"))
                        ? "bg-white/10 text-white"
                        : "text-white/65 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {item.expandable && (
  <ChevronDown
    className={`h-4 w-4 transition-transform ${
      (isPedagogie && pedagogieOpen) ||
      (isEnseignants && enseignantsOpen)
        ? "rotate-180"
        : ""
    }`}
  />
)}
                  </button>

                  {((isPedagogie && pedagogieOpen) ||
  (isEnseignants && enseignantsOpen)) &&
  item.children && (
                      <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">

                        {item.children.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            pathname.startsWith(`${child.href}/`);

                          return (
                            <button
                              key={child.href}
                              type="button"
                              onClick={() => router.push(child.href)}
                              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition ${
                                childActive
                                  ? "bg-[#6366F1] font-semibold text-white"
                                  : "text-white/55 hover:bg-white/5 hover:text-white"
                              }`}
                            >
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
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366F1]">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">
                {fullName}
              </p>

              <p className="truncate text-xs text-white/50">
                {userRole || "Utilisateur"}
              </p>

            </div>

          </div>
        </div>

      </div>
    </aside>
  );
}