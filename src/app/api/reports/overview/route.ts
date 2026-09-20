import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { tenantReport } from "@/lib/services/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const report = await tenantReport(schoolId);
    return jsonOk({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
