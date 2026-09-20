import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { notFound } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requireSuperAdmin();
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        plan: true,
        _count: { select: { users: true, students: true, staff: true } },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 12 },
      },
    });
    if (!tenant) throw notFound("Tenant not found");
    return jsonOk({ tenant });
  } catch (error) {
    return handleRouteError(error);
  }
}
