"use client";

import { CalendarCheck2, LayoutDashboard, ShieldAlert } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/vie-scolaire", icon: LayoutDashboard },
  { label: "Présences & absences", href: "/vie-scolaire/presences", icon: CalendarCheck2 },
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
