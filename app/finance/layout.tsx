"use client";

import {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
} from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/finance", icon: LayoutDashboard },
  { label: "Paiements", href: "/finance/paiements", icon: Wallet },
  { label: "Reçus", href: "/finance/recus", icon: Receipt },
  { label: "Rapports", href: "/finance/rapports", icon: BarChart3 },
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
