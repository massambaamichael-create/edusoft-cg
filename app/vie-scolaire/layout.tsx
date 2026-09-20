"use client";

import {
  LayoutDashboard,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/vie-scolaire", icon: LayoutDashboard },
  { label: "Présences", href: "/vie-scolaire/presences", icon: UserCheck },
  { label: "Discipline", href: "/vie-scolaire/discipline", icon: ShieldAlert },
];

export default function VieScolaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="vie-scolaire"
      title="Vie scolaire"
      accentClass="bg-indigo-900"
      nav={NAV}
      allowedRoles={["Surveillant", "Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
