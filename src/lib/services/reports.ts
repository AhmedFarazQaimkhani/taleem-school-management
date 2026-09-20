import { prisma } from "@/lib/prisma";
import { collectionPercent } from "@/lib/fees/calculate";

export async function tenantReport(schoolId: string) {
  const [enrollment, attendance, invoices] = await Promise.all([
    prisma.student.count({ where: { schoolId, deletedAt: null } }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { _all: true },
    }),
    prisma.feeInvoice.aggregate({
      where: { schoolId, status: { not: "VOID" } },
      _sum: { amountPaisa: true, paidPaisa: true },
    }),
  ]);

  const attendanceTotal = attendance.reduce((sum, row) => sum + row._count._all, 0);
  const present = attendance
    .filter((row) => row.status === "PRESENT" || row.status === "LATE")
    .reduce((sum, row) => sum + row._count._all, 0);

  const billed = invoices._sum.amountPaisa ?? 0;
  const collected = invoices._sum.paidPaisa ?? 0;

  return {
    enrollment,
    attendancePercent: attendanceTotal === 0 ? 0 : Math.round((present / attendanceTotal) * 10000) / 100,
    attendanceMarked: attendanceTotal,
    feeCollectionPercent: collectionPercent(billed, collected),
    billedPaisa: billed,
    collectedPaisa: collected,
  };
}

export async function platformReport() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true, status: true },
    orderBy: { name: "asc" },
  });

  const rows = [];
  let enrollment = 0;
  let billedPaisa = 0;
  let collectedPaisa = 0;
  let attendanceMarked = 0;
  let attendancePresent = 0;

  for (const tenant of tenants) {
    const stats = await tenantReport(tenant.id);
    enrollment += stats.enrollment;
    billedPaisa += stats.billedPaisa;
    collectedPaisa += stats.collectedPaisa;
    attendanceMarked += stats.attendanceMarked;
    attendancePresent += Math.round((stats.attendancePercent / 100) * stats.attendanceMarked);
    rows.push({ ...tenant, ...stats });
  }

  return {
    totals: {
      tenants: tenants.length,
      enrollment,
      attendancePercent:
        attendanceMarked === 0 ? 0 : Math.round((attendancePresent / attendanceMarked) * 10000) / 100,
      feeCollectionPercent: collectionPercent(billedPaisa, collectedPaisa),
      billedPaisa,
      collectedPaisa,
    },
    tenants: rows,
  };
}
