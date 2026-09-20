import { getTenantClient } from "@/lib/prisma-tenant";
import { pakistanToday, type CalendarDay } from "@/lib/billing-schedule";
import { paisaToPkr } from "@/lib/money";
import { collectionPercent } from "@/lib/fees/calculate";

export const DASHBOARD_RANGES = ["14d", "30d", "month", "year", "custom"] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export type DashboardFilterInput = {
  yearId?: string | null;
  classId?: string | null;
  range?: string | null;
  from?: string | null;
  to?: string | null;
};

export type DashboardFilters = {
  yearId: string | null;
  classId: string | null;
  range: DashboardRange;
  from: CalendarDay;
  to: CalendarDay;
};

export function addCalendarDays(day: CalendarDay, delta: number): CalendarDay {
  const date = new Date(Date.UTC(day.year, day.month - 1, day.day + delta));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function lastNDays(n: number, today = pakistanToday()): CalendarDay[] {
  return Array.from({ length: n }, (_, index) => addCalendarDays(today, index - (n - 1)));
}

function isoDay(day: CalendarDay) {
  return `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
}

function utcDate(day: CalendarDay) {
  return new Date(Date.UTC(day.year, day.month - 1, day.day));
}

function parseIsoDay(value: string | null | undefined): CalendarDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function daysBetween(from: CalendarDay, to: CalendarDay) {
  return Math.round((utcDate(to).getTime() - utcDate(from).getTime()) / 86_400_000) + 1;
}

function eachDay(from: CalendarDay, to: CalendarDay) {
  const count = Math.max(1, daysBetween(from, to));
  return Array.from({ length: count }, (_, index) => addCalendarDays(from, index));
}

export function resolveDashboardFilters(input: DashboardFilterInput, today = pakistanToday()): DashboardFilters {
  const requested = DASHBOARD_RANGES.includes(input.range as DashboardRange) ? (input.range as DashboardRange) : "14d";
  let from = addCalendarDays(today, -13);
  let to = today;
  let range = requested;

  if (requested === "30d") from = addCalendarDays(today, -29);
  else if (requested === "month") from = { year: today.year, month: today.month, day: 1 };
  else if (requested === "year") from = { year: today.year, month: 1, day: 1 };
  else if (requested === "custom") {
    const customFrom = parseIsoDay(input.from);
    const customTo = parseIsoDay(input.to);
    if (customFrom && customTo) {
      from = customFrom;
      to = customTo;
    } else {
      range = "14d";
      from = addCalendarDays(today, -13);
    }
  }

  if (utcDate(from) > utcDate(to)) {
    const swap = from;
    from = to;
    to = swap;
  }

  return {
    yearId: input.yearId?.trim() || null,
    classId: input.classId?.trim() || null,
    range,
    from,
    to,
  };
}

export async function dashboardData(schoolId: string, input: DashboardFilterInput = {}) {
  const db = getTenantClient(schoolId);
  const filters = resolveDashboardFilters(input);
  const fromDate = utcDate(filters.from);
  const toDate = utcDate(filters.to);
  const studentWhere = {
    deletedAt: null as Date | null,
    ...(filters.yearId ? { academicYearId: filters.yearId } : {}),
    ...(filters.classId ? { classId: filters.classId } : {}),
  };

  const scopedStudents =
    filters.yearId || filters.classId
      ? await db.student.findMany({ where: studentWhere, select: { id: true } })
      : null;
  const studentIds = scopedStudents?.map((row) => row.id) ?? null;
  const attendanceWhere = {
    date: { gte: fromDate, lte: toDate },
    ...(studentIds ? { studentId: { in: studentIds } } : {}),
  };
  const invoiceWhere = {
    status: { not: "VOID" as const },
    dueDate: { gte: fromDate, lte: toDate },
    ...(studentIds ? { studentId: { in: studentIds } } : {}),
  };

  const [
    enrollment,
    attendanceByStatus,
    studentsByClass,
    studentsByGender,
    invoicesByStatus,
    invoiceTotals,
    invoices,
    attendanceRows,
    classes,
    payrollByStatus,
  ] = await Promise.all([
    db.student.count({ where: studentWhere }),
    db.attendanceRecord.groupBy({ by: ["status"], where: attendanceWhere, _count: { _all: true } }),
    db.student.groupBy({ by: ["classId"], where: studentWhere, _count: { _all: true } }),
    db.student.groupBy({ by: ["gender"], where: studentWhere, _count: { _all: true } }),
    db.feeInvoice.groupBy({
      by: ["status"],
      where: invoiceWhere,
      _count: { _all: true },
      _sum: { amountPaisa: true, paidPaisa: true },
    }),
    db.feeInvoice.aggregate({
      where: invoiceWhere,
      _sum: { amountPaisa: true, paidPaisa: true },
    }),
    db.feeInvoice.findMany({
      where: invoiceWhere,
      select: { periodLabel: true, amountPaisa: true, paidPaisa: true },
    }),
    db.attendanceRecord.findMany({
      where: attendanceWhere,
      select: { date: true, status: true },
    }),
    db.class.findMany({
      where: filters.yearId ? { academicYearId: filters.yearId } : {},
      select: { id: true, name: true, sortOrder: true },
    }),
    db.payrollPayment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: fromDate, lte: new Date(toDate.getTime() + 86_400_000 - 1) } },
      _count: { _all: true },
      _sum: { amountPaisa: true },
    }),
  ]);

  const attendanceTotal = attendanceByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const present = attendanceByStatus
    .filter((row) => row.status === "PRESENT" || row.status === "LATE")
    .reduce((sum, row) => sum + row._count._all, 0);
  const billed = invoiceTotals._sum.amountPaisa ?? 0;
  const collected = invoiceTotals._sum.paidPaisa ?? 0;

  const className = new Map(classes.map((klass) => [klass.id, klass.name]));
  const enrollmentByClass = studentsByClass
    .map((row) => ({
      name: row.classId ? (className.get(row.classId) ?? "Class") : "",
      key: row.classId ? row.classId : "unassigned",
      students: row._count._all,
      sort: row.classId ? (classes.find((klass) => klass.id === row.classId)?.sortOrder ?? 99) : 100,
    }))
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .map(({ name, key, students }) => ({ name, key, students }));

  const feesByPeriodMap = new Map<string, { billed: number; collected: number }>();
  for (const invoice of invoices) {
    const key = invoice.periodLabel?.trim() || "unlabelled";
    const current = feesByPeriodMap.get(key) ?? { billed: 0, collected: 0 };
    current.billed += invoice.amountPaisa;
    current.collected += invoice.paidPaisa;
    feesByPeriodMap.set(key, current);
  }
  const feesByPeriod = Array.from(feesByPeriodMap.entries()).map(([name, row]) => ({
    name,
    billed: paisaToPkr(row.billed),
    collected: paisaToPkr(row.collected),
  }));

  const byDate = new Map<string, { total: number; present: number }>();
  const monthly = daysBetween(filters.from, filters.to) > 45;
  for (const row of attendanceRows) {
    const iso = row.date.toISOString().slice(0, 10);
    const key = monthly ? iso.slice(0, 7) : iso;
    const current = byDate.get(key) ?? { total: 0, present: 0 };
    current.total += 1;
    if (row.status === "PRESENT" || row.status === "LATE") current.present += 1;
    byDate.set(key, current);
  }

  const attendanceTrend = monthly
    ? Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, row]) => ({
          date,
          percent: row.total > 0 ? Math.round((row.present / row.total) * 1000) / 10 : 0,
          marked: row.total,
        }))
    : eachDay(filters.from, filters.to).map((day) => {
        const date = isoDay(day);
        const row = byDate.get(date);
        return {
          date,
          percent: row && row.total > 0 ? Math.round((row.present / row.total) * 1000) / 10 : 0,
          marked: row?.total ?? 0,
        };
      });

  return {
    filters,
    summary: {
      enrollment,
      attendancePercent: attendanceTotal === 0 ? 0 : Math.round((present / attendanceTotal) * 10000) / 100,
      attendanceMarked: attendanceTotal,
      feeCollectionPercent: collectionPercent(billed, collected),
      billedPaisa: billed,
      collectedPaisa: collected,
      outstandingPaisa: Math.max(0, billed - collected),
    },
    attendanceMix: attendanceByStatus.map((row) => ({
      key: row.status,
      value: row._count._all,
    })),
    enrollmentByClass,
    genderMix: studentsByGender.map((row) => ({
      key: row.gender,
      value: row._count._all,
    })),
    invoiceStatus: invoicesByStatus.map((row) => ({
      key: row.status,
      invoices: row._count._all,
      billed: paisaToPkr(row._sum.amountPaisa ?? 0),
    })),
    feesByPeriod,
    attendanceTrend,
    payrollMix: payrollByStatus.map((row) => ({
      key: row.status,
      value: paisaToPkr(row._sum.amountPaisa ?? 0),
      slips: row._count._all,
    })),
  };
}

export type DashboardChartsData = Awaited<ReturnType<typeof dashboardData>>;
