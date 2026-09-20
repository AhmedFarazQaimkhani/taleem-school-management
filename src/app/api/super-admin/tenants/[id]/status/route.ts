import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { notFound } from "@/lib/api";
import { tenantStatusSchema } from "@/lib/validations/tenant";

type Ctx = { params: { id: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireSuperAdmin();
    const body = tenantStatusSchema.parse(await request.json());

    const existing = await prisma.tenant.findUnique({ where: { id: params.id } });
    if (!existing) throw notFound("Tenant not found");

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    return jsonOk({ tenant: { id: tenant.id, status: tenant.status } });
  } catch (error) {
    return handleRouteError(error);
  }
}
