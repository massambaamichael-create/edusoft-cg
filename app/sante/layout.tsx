"use client";

import { LayoutDashboard, Activity } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/sante", icon: LayoutDashboard },
  { label: "Dossiers santé", href: "/sante/dossiers", icon: Activity },
];

export default function SanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="sante"
      title="Infirmerie"
      accentClass="bg-rose-900"
      nav={NAV}
      allowedRoles={["Infirmerie", "Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
