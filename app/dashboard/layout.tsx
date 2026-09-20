"use client";

import {
  Activity,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Administration", href: "/administration", icon: ShieldCheck },
  { label: "Pédagogie", href: "/pedagogie", icon: BookOpen },
  { label: "Enseignants", href: "/enseignants", icon: UsersRound },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Vie scolaire", href: "/vie-scolaire", icon: Activity },
  { label: "Ressources humaines", href: "/rh", icon: UsersRound },
  { label: "Infirmerie", href: "/sante", icon: Activity },
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
      accentClass="bg-[#1A2451]"
      nav={NAV}
      allowedRoles={["Directeur"]}
    >
      {children}
    </RoleSpaceShell>
  );
}
