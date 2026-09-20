import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  slug: z.string().trim().toLowerCase().max(48).optional().or(z.literal("")),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8).max(72),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
