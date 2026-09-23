"use client";

import { LayoutDashboard, UsersRound } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/rh", icon: LayoutDashboard },
  { label: "Personnel", href: "/rh/personnel", icon: UsersRound },
];

export default function RHLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleSpaceShell space="rh" title="Ressources humaines" accentClass="bg-slate-800" nav={NAV} allowedRoles={["RH", "Directeur"]}>
      {children}
    </RoleSpaceShell>
  );
}
