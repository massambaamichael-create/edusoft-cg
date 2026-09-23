"use client";

import {
  LayoutDashboard,
  Users,
  UserRound,
  ClipboardList,
} from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/administration", icon: LayoutDashboard },
  { label: "Élèves", href: "/administration/eleves", icon: Users },
  { label: "Parents", href: "/administration/parents", icon: UserRound },
  { label: "Inscriptions", href: "/administration/inscriptions", icon: ClipboardList },
];

export default function AdministrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="administration"
      title="Administration"
      accentClass="bg-slate-800"
      nav={NAV}
      allowedRoles={["Secrétaire", "Administrateur", "Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
