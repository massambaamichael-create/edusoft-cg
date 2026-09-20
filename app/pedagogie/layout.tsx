"use client";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/pedagogie", icon: LayoutDashboard },
  { label: "Classes", href: "/pedagogie/classes", icon: GraduationCap },
  { label: "Matières", href: "/pedagogie/matieres", icon: BookOpen },
  { label: "Emplois du temps", href: "/pedagogie/emploi-du-temps", icon: CalendarDays },
  { label: "Notes & bulletins", href: "/pedagogie/notes-bulletins", icon: ClipboardList },
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
