import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    await assertFeatureEnabled(schoolId, "timetable");
    const existing = await db.timetable.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Slot not found");
    await db.timetable.delete({ where: { id: params.id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
