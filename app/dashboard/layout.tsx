"use client";

import { LayoutDashboard } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSpaceShell
      space="direction"
      title="Direction"
      accentClass="bg-[#080B16]"
      nav={NAV}
      allowedRoles={["Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
