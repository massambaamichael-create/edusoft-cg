"use client";

import { LayoutDashboard, UsersRound } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Enseignants", href: "/enseignants", icon: UsersRound },
];

export default function EnseignantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="direction"
      title="Enseignants"
      accentClass="bg-[#1A2451]"
      nav={NAV}
      allowedRoles={["Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
