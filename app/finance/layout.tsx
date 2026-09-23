"use client";

import { CreditCard, LayoutDashboard, ReceiptText } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/finance", icon: LayoutDashboard },
  { label: "Paiements", href: "/finance/paiements", icon: CreditCard },
  { label: "Frais scolaires", href: "/finance/frais", icon: ReceiptText },
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
