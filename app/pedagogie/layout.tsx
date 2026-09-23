"use client";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserCog,
  CalendarDays,
} from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/pedagogie", icon: LayoutDashboard },
  { label: "Classes", href: "/pedagogie/classes", icon: GraduationCap },
  { label: "Matières", href: "/pedagogie/matieres", icon: BookOpen },
  { label: "Programmes & Progression", href: "/pedagogie/programmes", icon: ClipboardList },
  { label: "Emploi du temps", href: "/pedagogie/emploi-du-temps", icon: CalendarDays },
  { label: "Responsabilités pédagogiques", href: "/pedagogie/responsabilites", icon: UserCog },
  { label: "Évaluations & examens", href: "/pedagogie/evaluations", icon: ClipboardList },
  { label: "Corrections & notes", href: "/pedagogie/corrections", icon: ClipboardList },
];

export default function PedagogieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="pedagogie"
      title="Pédagogie"
      accentClass="bg-slate-900"
      nav={NAV}
      allowedRoles={["Directeur", "Directeur des Études"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
