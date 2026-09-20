"use client";

import {
  Activity,
  Archive,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Settings,
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
  { label: "Communication", href: "/communication", icon: Mail },
  { label: "Examens", href: "/examens", icon: GraduationCap },
  { label: "Archives", href: "/archives", icon: Archive },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Emploi du temps", href: "/planning", icon: CalendarDays },
  { label: "Paramètres", href: "/parametres", icon: Settings },
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
