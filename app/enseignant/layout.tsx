"use client";

import { BookOpen, ClipboardList, LayoutDashboard } from "lucide-react";
import RoleSpaceShell from "@/components/RoleSpaceShell";

const NAV = [
  { label: "Tableau de bord", href: "/enseignant", icon: LayoutDashboard },
  { label: "Mes matières & classes", href: "/enseignant/matieres", icon: BookOpen },
  { label: "Programmes & progression", href: "/enseignant/programmes", icon: ClipboardList },
  { label: "Évaluations & sujets", href: "/enseignant/evaluations", icon: ClipboardList },
];

export default function EnseignantLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleSpaceShell space="enseignant" title="Espace Enseignant" accentClass="bg-[#172554]" nav={NAV} allowedRoles={["Enseignant"]}>
      {children}
    </RoleSpaceShell>
  );
}
