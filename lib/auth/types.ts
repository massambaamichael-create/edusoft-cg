/**
 * Types for EduSoft CG auth / RBAC layer.
 * Aligned with Supabase helpers:
 * get_my_school_id, get_my_role, has_permission, get_my_permissions
 */

export type UserProfile = {
  id: string;
  auth_user_id: string;
  school_id: string;
  role_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  is_active?: boolean | null;
  must_change_password?: boolean | null;
};

export type School = {
  id: string;
  name: string;
  code: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  logo_url?: string | null;
};

export type RoleName =
  | "Directeur"
  | "Enseignant"
  | "Secrétaire"
  | "Comptable"
  | "Surveillant"
  | "RH"
  | "Infirmerie"
  | "Administrateur"
  | "Directeur des Études"
  | "Parent"
  | "Élève"
  | string;

/** Permission codes as stored in public.permissions */
export type PermissionCode =
  | "assessments.manage"
  | "assessments.read"
  | "attendance.read"
  | "attendance.write"
  | "audit.read"
  | "availability.manage_own"
  | "classes.manage"
  | "classes.read"
  | "communication.read"
  | "communication.send"
  | "dashboard.read"
  | "discipline.manage"
  | "discipline.read"
  | "documents.generate"
  | "documents.read"
  | "documents.upload"
  | "documents.validate"
  | "enrollments.manage"
  | "enrollments.read"
  | "exam_authorizations.manage"
  | "exam_authorizations.read"
  | "exams.manage"
  | "exams.read"
  | "finance.manage"
  | "finance.read"
  | "financial_reports.read"
  | "grades.read"
  | "grades.write"
  | "health.manage"
  | "health.read"
  | "hr.manage"
  | "hr.read"
  | "parents.manage"
  | "parents.read"
  | "payments.cancel"
  | "payments.create"
  | "planning.manage"
  | "planning.read"
  | "report_cards.manage"
  | "report_cards.read"
  | "roles.manage"
  | "roles.read"
  | "settings.manage"
  | "settings.read"
  | "students.archive"
  | "students.create"
  | "students.read"
  | "students.update"
  | "subjects.manage"
  | "subjects.read"
  | "teacher_assignments.manage"
  | "teacher_assignments.read"
  | "teachers.manage"
  | "teachers.read"
  | string;

export type CurrentUserContext = {
  profile: UserProfile | null;
  school: School | null;
  role: RoleName | null;
  permissions: PermissionCode[];
  schoolId: string | null;
  loading: boolean;
  error: string | null;
  /** True when auth session exists and profile was loaded */
  isAuthenticated: boolean;
  hasPermission: (code: PermissionCode) => boolean;
  hasAnyPermission: (...codes: PermissionCode[]) => boolean;
  isRole: (name: RoleName) => boolean;
  refresh: () => Promise<void>;
};
