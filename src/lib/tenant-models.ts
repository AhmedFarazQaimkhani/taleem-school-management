/**
 * Prisma model names (PascalCase, as received by query extensions)
 * that MUST be scoped by schoolId. Platform tables are excluded.
 */
export const TENANT_MODELS = new Set([
  "User",
  "Student",
  "Guardian",
  "Staff",
  "AcademicYear",
  "Class",
  "Section",
  "Subject",
  "Timetable",
  "AttendanceRecord",
  "FeeStructure",
  "FeeInvoice",
  "SchoolFeePayment",
  "Exam",
  "ExamResult",
  "Certificate",
  "Announcement",
  "SocialPost",
  "NotificationLog",
  "AuditLog",
  "PayrollPayment",
]);

export function isTenantModel(model: string): boolean {
  return TENANT_MODELS.has(model);
}

export function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}
