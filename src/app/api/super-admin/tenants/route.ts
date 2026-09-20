import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: { id: true, name: true, maxStudents: true, priceMonthlyPaisa: true },
        },
        _count: { select: { users: true, students: true } },
      },
    });
    return jsonOk({ tenants });
  } catch (error) {
    return handleRouteError(error);
  }
}
