import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { billingSettingsSchema } from "@/lib/validations/fees";
import { prisma } from "@/lib/prisma";
import { billingPreview, pakistanToday } from "@/lib/billing-schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: schoolId },
      select: { autoInvoiceEnabled: true, invoiceDueDay: true, invoiceGenerateDay: true },
    });
    return jsonOk({
      ...tenant,
      preview: billingPreview(pakistanToday(), tenant.invoiceDueDay, tenant.invoiceGenerateDay),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const body = billingSettingsSchema.parse(await request.json());
    const tenant = await prisma.tenant.update({
      where: { id: schoolId },
      data: {
        autoInvoiceEnabled: body.autoInvoiceEnabled,
        invoiceDueDay: body.invoiceDueDay,
        invoiceGenerateDay: body.invoiceGenerateDay,
      },
      select: { autoInvoiceEnabled: true, invoiceDueDay: true, invoiceGenerateDay: true },
    });
    return jsonOk({
      ...tenant,
      preview: billingPreview(pakistanToday(), tenant.invoiceDueDay, tenant.invoiceGenerateDay),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
