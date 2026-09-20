import { z } from "zod";

export const academicYearSchema = z.object({
  name: z.string().trim().min(4).max(40),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isCurrent: z.boolean().optional(),
});

export const classSchema = z.object({
  academicYearId: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  sortOrder: z.number().int().optional(),
});

export const sectionSchema = z.object({
  classId: z.string().min(1),
  name: z.string().trim().min(1).max(20),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  nameUrdu: z.string().trim().max(80).optional(),
  code: z.string().trim().max(20).optional(),
  classId: z.string().min(1).optional().nullable(),
});
