"use client";

import WorkspaceGuard from "@/components/WorkspaceGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceGuard allowedRoles={["Directeur"]} fallbackPath="/enseignant">
      {children}
    </WorkspaceGuard>
  );
}
