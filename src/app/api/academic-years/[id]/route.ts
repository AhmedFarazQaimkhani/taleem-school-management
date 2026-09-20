import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { academicYearSchema } from "@/lib/validations/setup";
import { parseDateOnly } from "@/lib/dates";
import { notFound } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { db } = await requireTenantUser(["ADMIN"]);
    const body = academicYearSchema.partial().parse(await request.json());
    const existing = await db.academicYear.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Academic year not found");
    if (body.isCurrent) {
      await db.academicYear.updateMany({ data: { isCurrent: false } });
    }
    const year = await db.academicYear.update({
      where: { id: params.id },
      data: {
        name: body.name,
        startDate: body.startDate ? parseDateOnly(body.startDate) : undefined,
        endDate: body.endDate ? parseDateOnly(body.endDate) : undefined,
        isCurrent: body.isCurrent,
      },
    });
    return jsonOk({ year });
  } catch (error) {
    return handleRouteError(error);
  }
}
