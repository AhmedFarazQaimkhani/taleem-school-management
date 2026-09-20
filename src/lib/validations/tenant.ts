import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(48, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

export const onboardTenantSchema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  slug: slugSchema,
  planId: z.string().min(1),
  adminName: z.string().trim().min(2).max(80),
  adminEmail: z.string().trim().email().toLowerCase(),
  adminPassword: z.string().min(8).max(72),
  adminPhone: z.string().trim().max(20).optional(),
});

export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>;

export const tenantStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]),
});
