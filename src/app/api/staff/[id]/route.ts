import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await requireTenantUser(["ADMIN"]);
    const existing = await db.staff.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) throw notFound("Staff not found");
    await db.staff.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
