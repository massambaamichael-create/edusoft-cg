import type { RoleName } from "./types";

/**
 * Home path per role — EduSoft multi-space principle.
 * One role = one primary workspace, not a single overloaded UI.
 */
export function getHomePathForRole(role: RoleName | null | undefined): string {
  switch (role) {
    case "Enseignant":
      return "/enseignant";
    case "Secrétaire":
    case "Administrateur":
      return "/dashboard"; // Administration space later → /administration
    case "Comptable":
      return "/dashboard"; // Finance space later → /finance
    case "Surveillant":
      return "/dashboard"; // Vie scolaire later → /vie-scolaire
    case "Directeur":
    case "Directeur des Études":
    default:
      return "/dashboard";
  }
}

/** Paths that belong to the teacher workspace */
export function isTeacherSpacePath(pathname: string): boolean {
  return pathname === "/enseignant" || pathname.startsWith("/enseignant/");
}

/** Paths considered "direction / staff" (full school UI) */
export function isDirectionSpacePath(pathname: string): boolean {
  if (pathname === "/") return false;
  if (isTeacherSpacePath(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;
  return true;
}
