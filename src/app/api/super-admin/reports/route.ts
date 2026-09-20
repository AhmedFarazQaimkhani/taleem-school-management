import { requireSuperAdmin } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { platformReport } from "@/lib/services/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
    const report = await platformReport();
    return jsonOk({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
