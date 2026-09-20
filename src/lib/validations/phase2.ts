import { z } from "zod";

export const staffSchema = z.object({
  employeeCode: z.string().trim().min(1).max(20),
  name: z.string().trim().min(2).max(80),
  nameUrdu: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  type: z.enum(["TEACHER", "ACCOUNTANT", "ADMIN", "OTHER"]),
  designation: z.string().trim().max(80).optional().nullable(),
  cnic: z.string().trim().max(20).optional().nullable(),
  salaryPkr: z.number().nonnegative().optional().nullable(),
  loginEmail: z.string().email().optional().nullable().or(z.literal("")),
  loginPassword: z.string().min(8).optional().nullable().or(z.literal("")),
  loginRole: z.enum(["TEACHER", "ACCOUNTANT", "ADMIN"]).optional(),
});

export const payrollGenerateSchema = z.object({
  periodLabel: z.string().trim().min(2).max(40),
});

export const payrollPaySchema = z.object({
  method: z.enum(["CASH", "BANK"]),
});

export const timetableSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  staffId: z.string().min(1).optional().nullable(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}/),
  endTime: z.string().regex(/^\d{2}:\d{2}/),
  room: z.string().trim().max(40).optional().nullable(),
});

export const examSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["MIDTERM", "FINAL", "QUIZ", "ASSIGNMENT", "OTHER"]),
  academicYearId: z.string().min(1),
  classId: z.string().min(1).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const examResultsSchema = z.object({
  subjectId: z.string().min(1),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      marksObtained: z.number().nonnegative(),
      marksTotal: z.number().positive(),
      remarks: z.string().trim().max(200).optional().nullable(),
    }),
  ).min(1),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(4000),
  audience: z.enum(["ALL", "STAFF", "PARENTS", "STUDENTS"]),
});

export const SOCIAL_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "WHATSAPP", "YOUTUBE", "TIKTOK", "X"] as const;
export type SocialPlatformValue = (typeof SOCIAL_PLATFORMS)[number];

export const socialPostSchema = z.object({
  title: z.string().trim().min(2).max(120),
  caption: z.string().trim().min(2).max(4000),
  captionUrdu: z.string().trim().max(4000).optional().nullable(),
  hashtags: z.string().trim().max(500).optional().nullable(),
  linkUrl: z.string().trim().max(500).optional().nullable(),
  platforms: z.array(z.enum(SOCIAL_PLATFORMS)).min(1),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).default("DRAFT"),
  scheduledAt: z.string().trim().max(40).optional().nullable(),
});

export const socialPostUpdateSchema = socialPostSchema.partial();

export const certificateSchema = z.object({
  studentId: z.string().min(1),
  type: z.enum(["BONAFIDE", "CHARACTER", "LEAVING"]),
});
