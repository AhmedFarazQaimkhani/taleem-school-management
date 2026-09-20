import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { classSchema } from "@/lib/validations/setup";
import { notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const academicYearId = new URL(request.url).searchParams.get("academicYearId");
    const classes = await db.class.findMany({
      where: academicYearId ? { academicYearId } : {},
      include: { sections: true, academicYear: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return jsonOk({ classes });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = classSchema.parse(await request.json());
    const year = await db.academicYear.findFirst({ where: { id: body.academicYearId } });
    if (!year) throw notFound("Academic year not found");
    const klass = await db.class.create({
      data: {
        schoolId,
        academicYearId: body.academicYearId,
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return jsonOk({ class: klass }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
