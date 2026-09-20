import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { payrollPaySchema } from "@/lib/validations/phase2";
import { notFound } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId, session } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    await assertFeatureEnabled(schoolId, "payroll");
    const body = payrollPaySchema.parse(await request.json());
    const payment = await db.payrollPayment.findFirst({ where: { id: params.id } });
    if (!payment) throw notFound("Payroll row not found");
    const updated = await db.payrollPayment.update({
      where: { id: payment.id },
      data: { status: "PAID", method: body.method, paidAt: new Date() },
    });
    await writeAudit(db, {
      schoolId,
      actorId: session.user.id,
      action: "PAYROLL_PAID",
      entity: "PayrollPayment",
      entityId: payment.id,
      before: payment,
      after: updated,
    });
    return jsonOk({ payment: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
