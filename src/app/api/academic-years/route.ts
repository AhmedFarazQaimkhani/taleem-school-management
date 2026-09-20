import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { academicYearSchema } from "@/lib/validations/setup";
import { parseDateOnly } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const years = await db.academicYear.findMany({ orderBy: { startDate: "desc" } });
    return jsonOk({ years });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = academicYearSchema.parse(await request.json());
    if (body.isCurrent) {
      await db.academicYear.updateMany({ data: { isCurrent: false } });
    }
    const year = await db.academicYear.create({
      data: {
        schoolId,
        name: body.name,
        startDate: parseDateOnly(body.startDate),
        endDate: parseDateOnly(body.endDate),
        isCurrent: body.isCurrent ?? false,
      },
    });
    return jsonOk({ year }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
