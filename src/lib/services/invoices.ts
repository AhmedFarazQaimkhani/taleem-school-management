import type { TenantClient } from "@/lib/prisma-tenant";
import { conflict, notFound } from "@/lib/api";
import { parseDateOnly, startOfTodayUtc } from "@/lib/dates";
import { dueDateIso, periodLabel } from "@/lib/billing-schedule";
import { applyPayment } from "@/lib/fees/calculate";
import { pkrToPaisa } from "@/lib/money";
import { getSchoolFeePaymentGateway, type SchoolFeeMethod } from "@/lib/services/payment-school-fee";
import { writeAudit } from "@/lib/audit";
import { sendAndLog } from "@/lib/notify";

export async function nextInvoiceNo(db: TenantClient) {
  const count = await db.feeInvoice.count();
  return `INV-${new Date().getUTCFullYear()}-${String(count + 1).padStart(5, "0")}`;
}

export async function nextReceiptNo(db: TenantClient) {
  const count = await db.schoolFeePayment.count({ where: { status: "PAID" } });
  return `RCPT-${new Date().getUTCFullYear()}-${String(count + 1).padStart(5, "0")}`;
}

export async function generateInvoices(
  db: TenantClient,
  input: {
    schoolId: string;
    feeStructureId: string;
    periodLabel: string;
    dueDate: string;
    issuedById?: string;
  },
) {
  const structure = await db.feeStructure.findFirst({ where: { id: input.feeStructureId } });
  if (!structure) throw notFound("Fee structure not found");

  const students = await db.student.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(structure.classId ? { classId: structure.classId } : {}),
    },
    select: { id: true },
  });

  const existing = await db.feeInvoice.findMany({
    where: { feeStructureId: structure.id, periodLabel: input.periodLabel },
    select: { studentId: true },
  });
  const already = new Set(existing.map((row) => row.studentId));
  const dueDate = parseDateOnly(input.dueDate);

  let created = 0;
  for (const student of students) {
    if (already.has(student.id)) continue;
    const invoiceNo = await nextInvoiceNo(db);
    await db.feeInvoice.create({
      data: {
        schoolId: input.schoolId,
        studentId: student.id,
        feeStructureId: structure.id,
        invoiceNo,
        periodLabel: input.periodLabel,
        amountPaisa: structure.amountPaisa,
        dueDate,
        status: "ISSUED",
        issuedById: input.issuedById,
      },
    });
    created += 1;
  }

  return { created, skipped: students.length - created, totalStudents: students.length };
}

export async function generateMonthlyInvoices(
  db: TenantClient,
  input: {
    schoolId: string;
    dueDay: number;
    year: number;
    month: number;
    issuedById?: string;
  },
) {
  const period = periodLabel(input.year, input.month);
  const due = dueDateIso(input.year, input.month, input.dueDay);
  const structures = await db.feeStructure.findMany({ where: { frequency: "MONTHLY" } });

  let created = 0;
  let skipped = 0;
  for (const structure of structures) {
    const result = await generateInvoices(db, {
      schoolId: input.schoolId,
      feeStructureId: structure.id,
      periodLabel: period,
      dueDate: due,
      issuedById: input.issuedById,
    });
    created += result.created;
    skipped += result.skipped;
  }

  return {
    periodLabel: period,
    dueDate: due,
    structures: structures.length,
    created,
    skipped,
  };
}

export function effectiveInvoiceStatus(status: string, dueDate: Date, paidPaisa: number, amountPaisa: number) {
  if (status === "VOID" || status === "DRAFT" || status === "PAID") return status;
  if (paidPaisa >= amountPaisa) return "PAID";
  if (dueDate < startOfTodayUtc() && paidPaisa < amountPaisa) return "OVERDUE";
  if (paidPaisa > 0) return "PARTIAL";
  return status;
}

export async function recordFeePayment(
  db: TenantClient,
  input: {
    schoolId: string;
    invoiceId: string;
    amountPkr: number;
    method: SchoolFeeMethod;
    recordedById?: string;
    studentRef: string;
  },
) {
  const invoice = await db.feeInvoice.findFirst({
    where: { id: input.invoiceId },
    include: { student: { select: { name: true, admissionNo: true } } },
  });
  if (!invoice || invoice.status === "VOID") throw notFound("Invoice not found");

  const amountPaisa = pkrToPaisa(input.amountPkr);
  const remaining = invoice.amountPaisa - invoice.paidPaisa;
  if (amountPaisa > remaining) {
    throw conflict("Payment exceeds remaining balance");
  }

  const payment = await db.schoolFeePayment.create({
    data: {
      schoolId: input.schoolId,
      invoiceId: invoice.id,
      amountPaisa,
      status: "PENDING",
      method: input.method,
      recordedById: input.recordedById,
    },
  });

  const gateway = getSchoolFeePaymentGateway(input.method);
  const charged = await gateway.charge({
    schoolId: input.schoolId,
    invoiceId: invoice.id,
    paymentId: payment.id,
    amountPaisa,
    studentRef: input.studentRef,
    method: input.method,
  });

  if (!charged.ok) {
    await db.schoolFeePayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", providerRef: charged.providerRef },
    });
    throw new Error(charged.error ?? "Payment failed");
  }

  if (charged.immediate) {
    await settlePayment(db, payment.id, input.recordedById);
    return { paymentId: payment.id, status: "PAID" as const, checkoutUrl: null };
  }

  await db.schoolFeePayment.update({
    where: { id: payment.id },
    data: { providerRef: charged.providerRef },
  });

  return {
    paymentId: payment.id,
    status: "PENDING" as const,
    checkoutUrl: charged.checkoutUrl ?? `/pay/${payment.id}`,
  };
}

export async function settlePayment(db: TenantClient, paymentId: string, actorId?: string) {
  const payment = await db.schoolFeePayment.findFirst({
    where: { id: paymentId },
    include: { invoice: true },
  });
  if (!payment) throw notFound("Payment not found");
  if (payment.status === "PAID") return payment;

  const before = { ...payment.invoice };
  const applied = applyPayment(
    { amountPaisa: payment.invoice.amountPaisa, paidPaisa: payment.invoice.paidPaisa },
    payment.amountPaisa,
  );
  const receiptNo = await nextReceiptNo(db);

  const updatedPayment = await db.schoolFeePayment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      receiptNo,
    },
  });

  const invoice = await db.feeInvoice.update({
    where: { id: payment.invoiceId },
    data: {
      paidPaisa: applied.paidPaisa,
      status: applied.status,
    },
  });

  await writeAudit(db, {
    schoolId: payment.schoolId,
    actorId,
    action: "FEE_PAYMENT",
    entity: "FeeInvoice",
    entityId: invoice.id,
    before,
    after: invoice,
  });

  return updatedPayment;
}

export async function sendFeeReminders(
  db: TenantClient,
  schoolId: string,
  invoiceIds?: string[],
) {
  const invoices = await db.feeInvoice.findMany({
    where: {
      ...(invoiceIds?.length ? { id: { in: invoiceIds } } : {}),
      status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
    },
    include: {
      student: { include: { guardian: true } },
    },
  });

  let sent = 0;
  for (const invoice of invoices) {
    const phone = invoice.student.guardian?.phone;
    if (!phone) continue;
    const remaining = invoice.amountPaisa - invoice.paidPaisa;
    await sendAndLog(db, schoolId, {
      channel: "WHATSAPP",
      to: phone,
      body: `Fee reminder for ${invoice.student.name}: invoice ${invoice.invoiceNo} has Rs ${(remaining / 100).toFixed(0)} due (${invoice.periodLabel ?? "fees"}).`,
    });
    sent += 1;
  }
  return { sent, considered: invoices.length };
}
