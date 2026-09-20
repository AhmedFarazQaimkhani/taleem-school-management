import { z } from "zod";

export const studentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(80),
  nameUrdu: z.string().trim().max(80).optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  bFormOrCnic: z.string().trim().max(20).optional().or(z.literal("")),
  academicYearId: z.string().min(1).optional().nullable(),
  classId: z.string().min(1).optional().nullable(),
  sectionId: z.string().min(1).optional().nullable(),
  guardianName: z.string().trim().max(80).optional().or(z.literal("")),
  guardianPhone: z.string().trim().max(20).optional().or(z.literal("")),
  guardianRelation: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const studentImportSchema = z.object({
  csv: z.string().min(10),
});
