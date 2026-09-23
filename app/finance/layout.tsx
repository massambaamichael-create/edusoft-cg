"use client";

import { LayoutDashboard } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/finance", icon: LayoutDashboard },
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="finance"
      title="Finance"
      accentClass="bg-emerald-800"
      nav={NAV}
      allowedRoles={["Comptable", "Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
