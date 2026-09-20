import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { reminderSchema } from "@/lib/validations/fees";
import { sendFeeReminders } from "@/lib/services/invoices";

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const body = reminderSchema.parse(await request.json().catch(() => ({})));
    const result = await sendFeeReminders(db, schoolId, body.invoiceIds);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
