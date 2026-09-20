"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import type { RoleName } from "@/lib/auth";

export default function WorkspaceGuard({
  allowedRoles,
  fallbackPath = "/dashboard",
  children,
}: {
  allowedRoles: RoleName[];
  fallbackPath?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role, loading, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (!role || !allowedRoles.includes(role)) router.replace(fallbackPath);
  }, [allowedRoles, fallbackPath, isAuthenticated, loading, role, router]);

  if (loading || !isAuthenticated || !role || !allowedRoles.includes(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-sm">Vérification de votre espace…</p>
      </main>
    );
  }

  return <>{children}</>;
}
