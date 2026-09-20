import { prisma } from "@/lib/prisma";
import { dueDateIso, pakistanToday, periodLabel } from "@/lib/billing-schedule";
import { getPlatformSubscriptionGateway } from "@/lib/services/payment-platform";
import { getNotificationService } from "@/lib/services/notification";
import { notFound } from "@/lib/api";

const GRACE_DAYS = 14;

export function platformPeriod(year: number, month: number) {
  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0));
  return {
    periodStart,
    periodEnd,
    dueDate: new Date(`${dueDateIso(year, month, 10)}T00:00:00.000Z`),
    label: periodLabel(year, month),
  };
}

export function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export async function generatePlatformInvoices(now = new Date()) {
  const today = pakistanToday(now);
  const period = platformPeriod(today.year, today.month);
  const tenants = await prisma.tenant.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    include: { plan: true, users: { where: { role: "ADMIN", status: "ACTIVE" }, take: 1 } },
  });

  let created = 0;
  let skipped = 0;
  for (const tenant of tenants) {
    const existing = await prisma.platformSubscriptionPayment.findFirst({
      where: { tenantId: tenant.id, periodStart: period.periodStart, periodEnd: period.periodEnd },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.platformSubscriptionPayment.create({
      data: {
        tenantId: tenant.id,
        planId: tenant.planId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        dueDate: period.dueDate,
        amountPaisa: tenant.plan.priceMonthlyPaisa,
        status: "PENDING",
      },
    });
    created += 1;
  }
  return { created, skipped, period: period.label };
}

export async function settleOverdueAndRemind(now = new Date()) {
  const today = pakistanToday(now);
  const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const pending = await prisma.platformSubscriptionPayment.findMany({
    where: { status: { in: ["PENDING", "OVERDUE"] }, paidAt: null },
    include: { tenant: { include: { users: { where: { role: "ADMIN", status: "ACTIVE" }, take: 1 } } } },
  });

  let overdue = 0;
  let reminded = 0;
  let suspended = 0;
  const notify = getNotificationService();

  for (const invoice of pending) {
    const due = invoice.dueDate ?? invoice.periodEnd;
    if (invoice.status === "PENDING" && due < todayUtc) {
      await prisma.platformSubscriptionPayment.update({
        where: { id: invoice.id },
        data: { status: "OVERDUE" },
      });
      overdue += 1;
    }

    const shouldRemind = !invoice.reminderSentAt || daysBetween(invoice.reminderSentAt, todayUtc) >= 7;
    if (shouldRemind && due <= todayUtc) {
      const admin = invoice.tenant.users[0];
      const to = admin?.email ?? admin?.phone ?? invoice.tenant.slug;
      await notify.send({
        schoolId: invoice.tenantId,
        channel: "EMAIL",
        to,
        body: `Taleem plan renewal: ${invoice.tenant.name} has Rs ${(invoice.amountPaisa / 100).toFixed(0)} due for the current billing period.`,
      });
      await prisma.platformSubscriptionPayment.update({
        where: { id: invoice.id },
        data: { reminderSentAt: new Date() },
      });
      reminded += 1;
    }

    if (invoice.tenant.status === "ACTIVE" && due < todayUtc && daysBetween(due, todayUtc) > GRACE_DAYS) {
      await prisma.tenant.update({
        where: { id: invoice.tenantId },
        data: { status: "SUSPENDED" },
      });
      suspended += 1;
    }
  }

  return { overdue, reminded, suspended };
}

export async function markPlatformPaid(id: string, method: string) {
  const invoice = await prisma.platformSubscriptionPayment.findUnique({ where: { id } });
  if (!invoice) throw notFound("Invoice not found");
  const charged = await getPlatformSubscriptionGateway().charge({
    tenantId: invoice.tenantId,
    planId: invoice.planId,
    amountPaisa: invoice.amountPaisa,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
  });
  if (!charged.ok) throw new Error(charged.error ?? "Platform payment failed");

  const updated = await prisma.platformSubscriptionPayment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date(), paymentMethod: method },
  });

  await prisma.tenant.update({
    where: { id: invoice.tenantId },
    data: { status: "ACTIVE" },
  });

  return updated;
}
