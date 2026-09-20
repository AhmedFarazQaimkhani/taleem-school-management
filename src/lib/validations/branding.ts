import { z } from "zod";

export const brandingSchema = z.object({
  headerText: z.string().trim().max(200).optional().nullable(),
  footerText: z.string().trim().max(300).optional().nullable(),
});
