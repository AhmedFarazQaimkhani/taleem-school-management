import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { payrollGenerateSchema } from "@/lib/validations/phase2";
import { periodLabel, pakistanToday } from "@/lib/billing-schedule";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    await assertFeatureEnabled(schoolId, "payroll");
    const period = new URL(request.url).searchParams.get("periodLabel") ?? "";
    const payments = await db.payrollPayment.findMany({
      where: period ? { periodLabel: period } : {},
      include: { staff: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ payments });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    await assertFeatureEnabled(schoolId, "payroll");
    const today = pakistanToday();
    const body = payrollGenerateSchema.parse({
      periodLabel: periodLabel(today.year, today.month),
      ...(await request.json().catch(() => ({}))),
    });
    const staff = await db.staff.findMany({ where: { deletedAt: null, salaryPaisa: { gt: 0 } } });
    let created = 0;
    let skipped = 0;
    for (const member of staff) {
      const existing = await db.payrollPayment.findFirst({
        where: { staffId: member.id, periodLabel: body.periodLabel },
      });
      if (existing || !member.salaryPaisa) {
        skipped += 1;
        continue;
      }
      await db.payrollPayment.create({
        data: {
          schoolId,
          staffId: member.id,
          periodLabel: body.periodLabel,
          amountPaisa: member.salaryPaisa,
        },
      });
      created += 1;
    }
    return jsonOk({ created, skipped, periodLabel: body.periodLabel }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
