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
      return "/administration";
    case "RH":
      return "/rh";
    case "Comptable":
      return "/finance";
    case "Surveillant":
      return "/vie-scolaire";
    case "Infirmerie":
      return "/sante";
    case "Directeur":
      return "/dashboard";
    case "Directeur des Études":
      return "/pedagogie";
    case "Parent":
      return "/parent"; // future
    case "Élève":
      return "/eleve"; // future
    default:
      return "/dashboard";
  }
}

export type AppSpace =
  | "direction"
  | "pedagogie"
  | "enseignant"
  | "administration"
  | "finance"
  | "vie-scolaire"
  | "rh"
  | "sante"
  | "parent"
  | "eleve"
  | "public";

export function getSpaceForPath(pathname: string): AppSpace {
  if (pathname === "/" || pathname.startsWith("/api/")) return "public";
  if (pathname === "/pedagogie" || pathname.startsWith("/pedagogie/"))
    return "pedagogie";
  if (pathname === "/enseignant" || pathname.startsWith("/enseignant/"))
    return "enseignant";
  if (pathname === "/administration" || pathname.startsWith("/administration/"))
    return "administration";
  if (pathname === "/finance" || pathname.startsWith("/finance/"))
    return "finance";
  if (pathname === "/vie-scolaire" || pathname.startsWith("/vie-scolaire/"))
    return "vie-scolaire";
  if (pathname === "/rh" || pathname.startsWith("/rh/")) return "rh";
  if (pathname === "/sante" || pathname.startsWith("/sante/")) return "sante";
  if (pathname === "/parent" || pathname.startsWith("/parent/")) return "parent";
  if (pathname === "/eleve" || pathname.startsWith("/eleve/")) return "eleve";
  return "direction";
}

/** Roles allowed in a given space */
export function rolesAllowedInSpace(space: AppSpace): RoleName[] {
  switch (space) {
    case "pedagogie":
      return ["Directeur", "Directeur des Études"];
    case "enseignant":
      return ["Enseignant"];
    case "administration":
      return ["Secrétaire", "Administrateur", "Directeur"];
    case "finance":
      return ["Comptable", "Directeur"];
    case "vie-scolaire":
      return ["Surveillant", "Directeur"];
    case "direction":
      return ["Directeur"];
    case "rh":
      return ["RH", "Directeur"];
    case "sante":
      return ["Infirmerie", "Directeur"];
    case "parent":
      return ["Parent"];
    case "eleve":
      return ["Élève"];
    default:
      return [];
  }
}

export function isTeacherSpacePath(pathname: string): boolean {
  return getSpaceForPath(pathname) === "enseignant";
}

export function isDirectionSpacePath(pathname: string): boolean {
  return getSpaceForPath(pathname) === "direction";
}

/**
 * Whether a role may access a path.
 * Directeur can enter admin/finance/vie-scolaire for pilotage.
 * Enseignant is locked to /enseignant.
 */
export function canRoleAccessPath(
  role: RoleName | null | undefined,
  pathname: string
): boolean {
  if (!role) return false;
  const space = getSpaceForPath(pathname);
  if (space === "public") return true;

  if (role === "Enseignant") {
    return space === "enseignant";
  }

  // The Director can supervise all operational staff spaces. The Directeur des Études
  // remains scoped to the pedagogical workspace.
  if (role === "Directeur") {
    return (
      space === "direction" ||
      space === "pedagogie" ||
      space === "administration" ||
      space === "finance" ||
      space === "vie-scolaire" ||
      space === "rh" ||
      space === "sante"
    );
  }

  const allowed = rolesAllowedInSpace(space);
  return allowed.includes(role);
}
