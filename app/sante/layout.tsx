"use client";

import { HeartPulse, LayoutDashboard } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/sante", icon: LayoutDashboard },
  { label: "Dossiers de santé", href: "/sante/dossiers", icon: HeartPulse },
];

export default function SanteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleSpaceShell space="sante" title="Infirmerie" accentClass="bg-rose-900" nav={NAV} allowedRoles={["Infirmerie", "Directeur"]}>
      {children}
    </RoleSpaceShell>
  );
}
