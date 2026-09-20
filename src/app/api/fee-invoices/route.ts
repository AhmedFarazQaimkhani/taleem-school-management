import { Prisma } from "@prisma/client";
import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { generateInvoicesSchema } from "@/lib/validations/fees";
import { generateInvoices, effectiveInvoiceStatus } from "@/lib/services/invoices";
import { parseListQuery, listMeta } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const url = new URL(request.url);
    const { page, pageSize, skip, q } = parseListQuery(url);
    const status = url.searchParams.get("status") ?? "";
    const studentId = url.searchParams.get("studentId") ?? "";

    const where: Prisma.FeeInvoiceWhereInput = {
      ...(studentId ? { studentId } : {}),
      ...(status ? { status: status as Prisma.EnumFeeInvoiceStatusFilter["equals"] } : {}),
      ...(q
        ? {
            OR: [
              { invoiceNo: { contains: q, mode: "insensitive" } },
              { student: { name: { contains: q, mode: "insensitive" } } },
              { student: { admissionNo: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, invoices] = await Promise.all([
      db.feeInvoice.count({ where }),
      db.feeInvoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, name: true, admissionNo: true } },
          feeStructure: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      }),
    ]);

    return jsonOk({
      invoices: invoices.map((invoice) => ({
        ...invoice,
        effectiveStatus: effectiveInvoiceStatus(
          invoice.status,
          invoice.dueDate,
          invoice.paidPaisa,
          invoice.amountPaisa,
        ),
        remainingPaisa: Math.max(0, invoice.amountPaisa - invoice.paidPaisa),
      })),
      meta: listMeta(total, page, pageSize),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, session, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const body = generateInvoicesSchema.parse(await request.json());
    const result = await generateInvoices(db, {
      schoolId,
      ...body,
      issuedById: session.user.id,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
