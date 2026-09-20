import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { recordPaymentSchema } from "@/lib/validations/fees";
import { recordFeePayment } from "@/lib/services/invoices";
import { notFound } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const invoice = await db.feeInvoice.findFirst({
      where: { id: params.id },
      include: {
        student: { include: { guardian: true, class: true, section: true } },
        feeStructure: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!invoice) throw notFound("Invoice not found");
    return jsonOk({ invoice, remainingPaisa: Math.max(0, invoice.amountPaisa - invoice.paidPaisa) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { db, session, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const body = recordPaymentSchema.parse(await request.json());
    const invoice = await db.feeInvoice.findFirst({
      where: { id: params.id },
      include: { student: true },
    });
    if (!invoice) throw notFound("Invoice not found");
    const result = await recordFeePayment(db, {
      schoolId,
      invoiceId: invoice.id,
      amountPkr: body.amountPkr,
      method: body.method,
      recordedById: session.user.id,
      studentRef: invoice.student.admissionNo,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
