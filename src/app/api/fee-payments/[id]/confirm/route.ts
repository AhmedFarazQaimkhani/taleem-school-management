import { prisma } from "@/lib/prisma";
import { getTenantClient } from "@/lib/prisma-tenant";
import { handleRouteError, jsonOk } from "@/lib/route";
import { settlePayment } from "@/lib/services/invoices";
import { notFound } from "@/lib/api";

type Ctx = { params: { id: string } };

/** Public wallet callback / mock checkout confirmation. */
export async function POST(_request: Request, { params }: Ctx) {
  try {
    const payment = await prisma.schoolFeePayment.findUnique({ where: { id: params.id } });
    if (!payment) throw notFound("Payment not found");
    const db = getTenantClient(payment.schoolId);
    const settled = await settlePayment(db, payment.id);
    return jsonOk({
      payment: {
        id: settled.id,
        status: settled.status,
        receiptNo: settled.receiptNo,
        method: settled.method,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
