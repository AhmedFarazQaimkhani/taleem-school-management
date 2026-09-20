import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { autoInvoicesSchema } from "@/lib/validations/fees";
import { prisma } from "@/lib/prisma";
import { generateMonthlyInvoices } from "@/lib/services/invoices";
import { pakistanToday, shouldAutoGenerate } from "@/lib/billing-schedule";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { db, session, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const body = autoInvoicesSchema.parse(await request.json().catch(() => ({})));
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: schoolId },
      select: { autoInvoiceEnabled: true, invoiceDueDay: true, invoiceGenerateDay: true },
    });

    const today = pakistanToday();
    if (!body.force && !tenant.autoInvoiceEnabled) {
      return jsonOk({ ran: false, reason: "disabled", created: 0, skipped: 0 });
    }
    if (!body.force && !shouldAutoGenerate(today, tenant.invoiceGenerateDay)) {
      return jsonOk({ ran: false, reason: "not_due_yet", created: 0, skipped: 0 });
    }

    const result = await generateMonthlyInvoices(db, {
      schoolId,
      dueDay: tenant.invoiceDueDay,
      year: today.year,
      month: today.month,
      issuedById: session.user.id,
    });
    return jsonOk({ ran: true, reason: body.force ? "manual" : "schedule", ...result }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
