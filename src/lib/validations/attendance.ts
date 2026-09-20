import { z } from "zod";

export const attendanceMarkSchema = z.object({
  sectionId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notifyAbsences: z.boolean().optional(),
  marks: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
        remarks: z.string().max(200).optional(),
      }),
    )
    .min(1),
});
