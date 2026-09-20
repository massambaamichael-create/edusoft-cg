import type { PermissionCode } from "@/lib/auth/types";
import type { ImportDomain } from "./types";

/**
 * Import is controlled by the existing métier permissions.
 * This does NOT grant permissions; it centralizes which existing
 * permission protects each import domain.
 *
 * Principle:
 * Rôle → permission → domaine → périmètre → école → année → données.
 */
export const IMPORT_DOMAIN_PERMISSIONS: Record<
  ImportDomain,
  PermissionCode[]
> = {
  school: ["settings.manage"],
  students: ["students.create", "students.update"],
  parents: ["parents.manage"],
  enrollments: ["enrollments.manage"],
  teachers: ["teachers.manage"],
  staff: ["hr.manage"],
  pedagogy: ["classes.manage", "subjects.manage"],
  teacher_assignments: ["teacher_assignments.manage"],
  finance: ["finance.manage", "payments.create"],
  assessments: ["assessments.manage", "grades.write"],
  attendance: ["attendance.write"],
  discipline: ["discipline.manage"],
  health: ["health.manage"],
  documents: ["documents.upload"],
};

export function getRequiredImportPermissions(
  domain: ImportDomain
): PermissionCode[] {
  return IMPORT_DOMAIN_PERMISSIONS[domain];
}

export function canImportDomain(
  domain: ImportDomain,
  permissions: readonly PermissionCode[]
): boolean {
  const granted = new Set(permissions);
  return getRequiredImportPermissions(domain).some((permission) =>
    granted.has(permission)
  );
}
