import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/route";
import { notFound } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const payment = await prisma.schoolFeePayment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: { student: { select: { name: true, admissionNo: true } } },
        },
      },
    });
    if (!payment) throw notFound("Payment not found");
    return jsonOk({
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amountPaisa: payment.amountPaisa,
        invoiceNo: payment.invoice.invoiceNo,
        studentName: payment.invoice.student.name,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
