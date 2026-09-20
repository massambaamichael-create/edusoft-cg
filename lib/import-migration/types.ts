export type ImportDomain =
  | "school"
  | "students"
  | "parents"
  | "enrollments"
  | "teachers"
  | "staff"
  | "pedagogy"
  | "teacher_assignments"
  | "finance"
  | "assessments"
  | "attendance"
  | "discipline"
  | "health"
  | "documents";

export type ImportSourceFormat = "xlsx" | "csv";

export type ImportMode = "create" | "update" | "upsert" | "migration";

export type ImportStatus =
  | "draft"
  | "analyzing"
  | "ready"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "cancelled";

export type ImportContext = {
  schoolId: string;
  academicYearId?: string | null;
  domain: ImportDomain;
  mode: ImportMode;
};

export type ImportSummary = {
  totalRows: number;
  validRows: number;
  creates: number;
  updates: number;
  duplicates: number;
  conflicts: number;
  errors: number;
};

export type ImportIdentityMatch =
  | "external_id"
  | "edusoft_id"
  | "email"
  | "phone"
  | "identity_and_birth_date"
  | "manual"
  | "none";

export type ImportConflict = {
  rowNumber: number;
  reason: string;
  candidates?: string[];
};

export type ImportResult = {
  status: ImportStatus;
  summary: ImportSummary;
  conflicts: ImportConflict[];
  errors: Array<{ rowNumber: number; message: string }>;
};
