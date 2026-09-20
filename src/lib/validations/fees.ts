import { z } from "zod";

export const feeStructureSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1).optional().nullable(),
  name: z.string().trim().min(2).max(80),
  amountPkr: z.number().positive(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "ONE_TIME"]),
});

export const generateInvoicesSchema = z.object({
  feeStructureId: z.string().min(1),
  periodLabel: z.string().trim().min(2).max(40),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const autoInvoicesSchema = z.object({
  force: z.boolean().optional(),
});

export const billingSettingsSchema = z.object({
  autoInvoiceEnabled: z.boolean(),
  invoiceDueDay: z.number().int().min(1).max(28),
  invoiceGenerateDay: z.number().int().min(1).max(28),
});

export const recordPaymentSchema = z.object({
  amountPkr: z.number().positive(),
  method: z.enum(["CASH", "BANK", "JAZZCASH", "EASYPAISA"]),
});

export const reminderSchema = z.object({
  invoiceIds: z.array(z.string().min(1)).optional(),
});
